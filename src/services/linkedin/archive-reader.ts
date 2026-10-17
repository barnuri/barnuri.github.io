import { readdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { ARCHIVE_FILES, type ArchiveFileKey } from '../../consts/linkedin-api.ts';
import { ExportFormatError } from '../../errors/export-format-error.ts';

export type ArchiveContents = Partial<Record<ArchiveFileKey, string>>;

export interface ArchiveReadResult {
  readonly source: string;
  readonly contents: ArchiveContents;
}

export class LinkedInArchiveReader {
  static readonly ZIP_EXTENSION = '.zip';

  async read(path: string): Promise<ArchiveReadResult> {
    const info = await stat(path).catch(() => null);
    if (!info) {
      throw new ExportFormatError(`${path} does not exist. Put the LinkedIn export zip in imports/linkedin/.`);
    }
    if (info.isFile()) {
      return { source: path, contents: LinkedInArchiveReader.readZip(await Bun.file(path).bytes(), path) };
    }
    const folderContents = await LinkedInArchiveReader.readFolder(path);
    if (Object.keys(folderContents).length > 0) {
      return { source: path, contents: folderContents };
    }
    const zips = await LinkedInArchiveReader.zipsNewestFirst(path);
    if (zips.length === 0) {
      throw new ExportFormatError(
        `${path} has no LinkedIn export. Add the zip LinkedIn emailed you, or its ${Object.values(ARCHIVE_FILES).join(', ')}.`,
      );
    }
    const contents: ArchiveContents = {};
    for (const zip of zips) {
      const zipContents = LinkedInArchiveReader.readZip(await Bun.file(zip).bytes(), zip);
      for (const [key, text] of Object.entries(zipContents) as [ArchiveFileKey, string][]) {
        contents[key] ??= text;
      }
    }
    return { source: zips.join(', '), contents };
  }

  static keyFor(fileName: string): ArchiveFileKey | null {
    const name = basename(fileName).toLowerCase();
    const entry = Object.entries(ARCHIVE_FILES).find(([, wanted]) => wanted.toLowerCase() === name);
    return entry ? (entry[0] as ArchiveFileKey) : null;
  }

  static readZip(bytes: Uint8Array, source: string): ArchiveContents {
    if (!source.toLowerCase().endsWith(LinkedInArchiveReader.ZIP_EXTENSION)) {
      throw new ExportFormatError(`${source} is not a zip file.`);
    }
    let entries: Record<string, Uint8Array>;
    try {
      entries = unzipSync(bytes, { filter: (file) => LinkedInArchiveReader.keyFor(file.name) !== null });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new ExportFormatError(`${source} could not be read as a zip: ${reason}`);
    }
    const contents: ArchiveContents = {};
    for (const [name, data] of Object.entries(entries)) {
      const key = LinkedInArchiveReader.keyFor(name);
      if (key && contents[key] === undefined) {
        contents[key] = strFromU8(data);
      }
    }
    return contents;
  }

  private static async readFolder(folder: string): Promise<ArchiveContents> {
    const contents: ArchiveContents = {};
    const names = await readdir(folder, { recursive: true });
    for (const name of names.toSorted()) {
      const key = LinkedInArchiveReader.keyFor(name);
      if (key && contents[key] === undefined) {
        contents[key] = await Bun.file(join(folder, name)).text();
      }
    }
    return contents;
  }

  static async newestZip(folder: string): Promise<{ path: string; modified: Date } | null> {
    const [newest] = await LinkedInArchiveReader.datedZips(folder);
    return newest ? { path: newest.path, modified: new Date(newest.modified) } : null;
  }

  private static async zipsNewestFirst(folder: string): Promise<string[]> {
    return (await LinkedInArchiveReader.datedZips(folder)).map((zip) => zip.path);
  }

  private static async datedZips(folder: string): Promise<{ path: string; modified: number }[]> {
    const names = await readdir(folder).catch(() => [] as string[]);
    const zips = names.filter((name) => name.toLowerCase().endsWith(LinkedInArchiveReader.ZIP_EXTENSION));
    const dated = await Promise.all(
      zips.map(async (name) => ({ path: join(folder, name), modified: (await stat(join(folder, name))).mtimeMs })),
    );
    return dated.toSorted((a, b) => b.modified - a.modified);
  }
}
