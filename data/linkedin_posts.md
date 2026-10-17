# LinkedIn posts

13 posts, source: browser, fetched 2026-10-17 19:07 UTC.

## 2026-10-15

I juggle a work and a personal GitHub account, and `gh auth switch` kept leaving me on the wrong one, especially with several terminals and AI agents running at once.

So I built ghx: a thin wrapper around the GitHub CLI that picks the account from the folder you are in. Map folders, drop a `.ghx` file in a repo, or match the ssh host alias in your git remote. Every gh command works unchanged, and git push uses the same account.

One static binary for macOS, Linux and Windows. Open source:

https://lnkd.in/dZFa_ZhE


#GitHub 
#DeveloperTools 
#OpenSource 
#CLI

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7516617810928771072/)
- video: /assets/linkedin/7516617810928771072-video.mp4

9 likes

## 2026-08-24

השבוע ניסיתי לשחק קצת עם herdr להבין על מה ההתלהבות, לפני שהתחלתי להשתמש בו חשבתי שזה סתם שאין בו כלום שום דבר מסובך לא ממש הבנתי את ההתלהבות אבל בעצם זה מה שהופך אותו לכלי חזק.

ואז התחלתי להשתמש בו — והבנתי שהכוח שלו הוא דווקא בפשטות: כאילו אין בו כלום, אבל יש בו הרבה.

ה־session לא נעלם רק כי החלון נסגר. אפשר לראות את כל הריצות של claude או כל harness אחר במקביל, על מסך אחד. ומערכת הפלאגינים כל כך פשוטה ופתוחה לשינויים, שכמעט בלי להתאמץ בניתי מנהל פרויקטים, ממשק Web, חיבור ל־Telegram ועדכון אוטומטי.

זה מה שחזק ב־herdr: מעט מאוד רעש, והמון כוח.

הרבה מאוד אנשים עברו להשתמש בעיקר בטרמינל אבל הטרמינל עצמו נשאר מאוד מיושן טכנולוגית זה מה ש herdr בה לפתור

קישורים:

herdr — https://herdr.dev

Project Manager — https://lnkd.in/dZ9Ymyya

Herdr Web — https://lnkd.in/dw4KQh-X

Telegram Notifications — https://lnkd.in/d7zXyTzG

Auto Update — https://lnkd.in/d3VmNUKh


#herdr 
#AIAgents 
#DeveloperTools

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7497656820765978624/)
- image: /assets/linkedin/7497656820765978624-1.jpg

50 likes, 8 comments

## 2026-07-03

Ever lose track of how many Claude Code sessions you have running? 🤖

If you're like me, you've got Claude Code open in three terminals, across four projects, and no idea which one is still working, which one is waiting for your input, and how much all of it is costing you.

So I built Claude Sessions Dashboard — a local dashboard that shows every Claude Code session on your machine in one place:

- 🔍 Live status for every session — running, waiting for ierminals and folders
- 💰 Token usage & running cost, computed from each session's actual transcript against current Claude API pricing (including prompt-cache reads/writes)
- ⚡ Kill any session or launch new headless ones right fro
- ▶️ A Resume button that copies claude --resume <id> so you can pick any session up in a real terminal

How it works: Claude Code already writes a transcript of evects. A small Bun backend parses those incrementally,cross-references the live process table, and pushes updates to a React 19 + Mantine frontend over a WebSocket every ~2 seconds. It runs entirely on your machine — nothing is sent anywhere.

It can even install itself as a system service (launchd on t's always running with a watchdog.

🎮 Try the live demo: https://lnkd.in/dHnKs6AB
⭐ Source code: https://lnkd.in/d_chYjW6

(The demo is the real UI wired to sample data, since GitHub Pages can't read your local sessions — run it locally for the real thing.)

Built with Bun, React 19, Vite, Mantine, and TanStack Query


#ClaudeCode 
#AI 
#DevTools 
#OpenSource 
#Bun 
#React

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7478797593632800769/)
- image: /assets/linkedin/7478797593632800769-1.gif

24 likes

## 2026-05-07

Most companies already expose APIs through Swagger/OpenAPI. 
The missing piece is usually turning them into AI-agent tools quickly.

With openapi-toolkit 2.9.0, you can generate a fully functional MCP server directly from an OpenAPI spec in seconds ⚡

No manual tool definitions. 
No custom wrappers. 
No rebuilding APIs specifically for AI agents.

Just use your existing OpenAPI definition and generate:
- MCP tools
- Server endpoints
- Type-safe clients
- AI-ready integrations

This dramatically reduces the effort required to connect existing platforms and services to ChatGPT, Claude, Cursor, and other MCP-compatible clients.

If you're working with MCP and already have REST APIs, this can save a lot of setup time.

Read more: 
https://lnkd.in/dFnMnhcR


#MCP 
#ModelContextProtocol 
#OpenAPI 
#Swagger 
#APIs 
#AI 
#AIAgents 
#DeveloperTools 
#LLM 
#GenAI

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7458157448978206720/)
- image: /assets/linkedin/7458157448978206720-1.jpg

4 likes

## 2026-05-04

LangTalks היה כנס ממש טוב — מאוד hands-on, פחות הייפ ויותר איך דברים באמת עובדים בפרודקשן.
המציאות היא שאתה לא בונה agent —
אתה בונה מערכת של agents,
עם אחד שמנהל, אחרים שמבצעים,
והמשחק האמיתי זה איך אתה שולט על כל הדבר הזה
ה־orchestrator + harness זה בעצם אותו סיפור —
מישהו שמנהל את העבודה, וסביבה שמאפשרת לו לא להתפרק
הקטע שמתחיל להיות מעניין:
אתה עובד מולו כמו מול ג׳וניור אמיתי
לא API, לא prompt חד פעמי —
אלא תקשורת רגילה לגמרי:
Slack, GitHub, מיילים, טיקטים
אתה נותן כיוון, פותח משימות, עושה review, מתקן
והוא כבר מפרק, מפעיל agents, ומחזיר תוצאה
אפשר גם לשלב agents של אחרים,
אבל עדיין להשאיר את האנשים המנוסים על ה-plan וה-review
כלומר:
agents עושים execution
אנשים נשארים על החלטות
אם זה בנוי טוב — זה מרגיש חלק
אם לא — זה מתפרק מהר 😅
והדבר הכי שווה בכנס —
קהילה שכבר עמוק בתוך זה ומשתפת מה באמת עובד
מי שעובד על הדברים האלה ביום-יום — זה קיצור דרך רציני והכל בעברית


https://lnkd.in/di4fnZN9

https://langtalks.ai/


#AI 
#Agents 
#LLM 
#Engineering 
#LangTalks

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7457055192782544896/)
- image: /assets/linkedin/7457055192782544896-1.jpg

16 likes

## 2026-04-16

The data on niche dominance vs. broad appeal is stark. Products that own a specific vertical before expanding show 3.5x better retention. The "no" list isn't a limitation on your roadmap, it's the definition of your competitive advantage. Linear proved this at scale.

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7450462886193164290/)
- image: /assets/linkedin/7450462886193164290-1.jpg

2 likes

## 2026-04-14

The ROI numbers alone justify this approach. When context is built in, your specification error rate drops and velocity climbs. This is exactly the operational leverage teams need.

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7449726048327532544/)
- image: /assets/linkedin/7449726048327532544-1.jpg

1 likes

## 2026-03-24

The pattern is clear in the data: context-aware systems show 3-4x higher accuracy and user adoption rates compared to stateless alternatives, yet adoption remains low because teams underestimate how much effort goes into maintaining that context quality. It's not about having memory, it's about having clean, reliable, actionable memory.

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7442253255356600320/)
- image: /assets/linkedin/7442253255356600320-1.jpg

1 likes

## 2026-03-23

This hits the mark.
AI isn’t just about speed — it’s about better thinking.
In cybersecurity, that difference really matters.

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7441905155006140416/)

## 2025-10-19

🚀 Just launched Web Terminal - A powerful browser-based terminal with modern web technologies!
Ever wished you could access your terminal from anywhere? I've built a comprehensive web-based terminal application that brings the power of the command line to your browser with a sleek, modern interface.
✨ Key Features:
• Full terminal emulation powered by xterm.js
• Multi-tab support for managing multiple sessions
• Dark/light theme switching
• OAuth authentication (Google & GitHub)
• Session persistence and reconnection
• Mobile-friendly virtual keyboard
• Configurable security and access controls
🛠️ Tech Stack:
Built with a modern, production-ready stack:
• Backend: NestJS + TypeScript + Socket.IO
• Frontend: React 18 + Vite + TypeScript
• Terminal: xterm.js + node-pty
• Authentication: Passport.js + JWT
🎥 See it in action: Check out the demo video in the README to see all features in action!
The project includes comprehensive authentication, session management, and mobile UI patterns - perfect for teams needing secure, remote terminal access or developers wanting to showcase terminal applications.
🔗 GitHub: https://lnkd.in/dQW-8ENu

#WebDevelopment 
#Terminal 
#NestJS 
#React 
#TypeScript 
#OpenSource 
#WebSockets 
#DevTools

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7385683667756474368/)
- video: 

28 likes

## 2025-05-23

🚀 Join Our Team at Check Point Software Technologies!
We're expanding our global cybersecurity team and seeking passionate professionals.
Explore open roles and apply today:
 https://lnkd.in/dfU_Ka4D


#CheckPointCareers 
#CyberSecurityJobs 
#WeAreHiring

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7331706354564251649/)
- article: https://careers.checkpoint.com/index.php?m=cpcareers&a=search

4 likes

## 2025-01-29

🚀 Supercharge Your API Development with OpenAPI Toolkit 🚀
If you work with OpenAPI (Swagger) specifications, OpenAPI Toolkit is here to make your life easier. This open-source tool automates the generation of both server and client code, streamlining your API development process and reducing errors.
Key Features: 
✅ Automatic Code Generation
✅ Supports Multiple Languages (TypeScript, Python, Go, C#, etc.)
✅ Reduces Errors & Ensures Consistency
Get started today:
💻 OpenAPI Toolkit

hashtag
#API 
hashtag
#Development 
hashtag
#OpenAPI 
hashtag
#CodeGeneration 
hashtag
#TechTools
https://lnkd.in/dQBN7kT7

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7290402558903291904/)
- article: https://barnuri.github.io/blog/openapi-toolkit/#/

20 likes, 1 comments

## 2024-12-05

Simplify KQL querying for Azure Data Explorer using LINQ with CSharp.OpenSource.LinqToKql. The library, translates LINQ queries into optimized KQL syntax, streamlining .NET development and boosting efficiency. It saves time, reduces errors, and integrates seamlessly with Kusto databases. Plus, it’s open-source and welcomes community contributions.

[Open on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7270452822050004993/)
- article: https://barnuri.github.io/blog/LinqToKql/#/

36 likes, 4 comments
