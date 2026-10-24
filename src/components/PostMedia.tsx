import type { LinkedInPost } from '../schemas/linkedin/linkedin-post.ts';
import { formatDate } from '../services/site/format.ts';

interface PostMediaProps {
  readonly post: LinkedInPost;
  readonly compact?: boolean;
}

export function PostMedia({ post, compact = false }: PostMediaProps) {
  const when = post.published_at ? ` from ${formatDate(post.published_at)}` : '';
  const images = post.media.filter((item) => item.kind === 'image' && item.url).map((item) => item.url as string);
  const video = post.media.find((item) => item.kind === 'video' && (item.url || item.poster));
  const shownImages = compact ? images.slice(0, video ? 0 : 1) : images;
  if (shownImages.length === 0 && !video) {
    return null;
  }
  return (
    <div className={compact ? 'post-media post-media-compact' : 'post-media'}>
      {shownImages.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={`Image ${index + 1} in the LinkedIn post${when}`}
          loading="lazy"
          decoding="async"
          data-zoom={post.url}
        />
      ))}
      {video?.url && !compact && (
        <video controls preload="none" playsInline src={video.url} poster={video.poster ?? undefined} aria-label={`Video in the LinkedIn post${when}`} />
      )}
      {video && (compact || !video.url) && video.poster && (
        <a className="video-link" href={post.url}>
          <img src={video.poster} alt={`Preview of the video in the LinkedIn post${when}`} loading="lazy" decoding="async" />
          <span className="video-badge">Watch video</span>
        </a>
      )}
    </div>
  );
}
