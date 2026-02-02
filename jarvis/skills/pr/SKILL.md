# PR — Public Relations and communications

Use this skill for **Public Relations and comms**: key messages, press release outline, social post templates, media pitch, and comms brief. JARVIS returns structured outlines and templates for you to fill or for the agent to expand in conversation.

**Not to be confused with Pull request (GitHub)** — that skill is in `skills/pull-request/`.

## When to use

- **"Key messages for [product] for press"**, **"Talking points for [audience]"** → `key_messages`
- **"Press release outline for [announcement]"**, **"Draft a press release structure"** → `press_release_outline`
- **"Social post for [topic] for Twitter/LinkedIn"**, **"Tweet ideas for launch"** → `social_post_templates`
- **"Media pitch for [story angle]"**, **"Pitch outline for tech press"** → `media_pitch_outline`
- **"Comms brief for [launch]"**, **"Comms playbook for [announcement]"** → `comms_brief`

## Tools

| Tool | Use for |
|------|---------|
| `key_messages` | Key messages / talking points for topic + audience |
| `press_release_outline` | Press release structure: headline, subhead, sections |
| `social_post_templates` | Social post options for Twitter, LinkedIn, or generic |
| `media_pitch_outline` | Media pitch: subject line, hook, body outline |
| `comms_brief` | Comms playbook: do's/don'ts, messages, channels |

## Examples

- **"Key messages for our product launch for investors"**  
  `key_messages({ topic: "product launch", audience: "investors", tone: "professional" })`

- **"Press release outline for new feature announcement"**  
  `press_release_outline({ topic: "new feature", audience: "tech press", key_points: "speed, security" })`

- **"Tweet templates for conference talk"**  
  `social_post_templates({ platform: "twitter", topic: "conference talk", call_to_action: "link to slides" })`

- **"Media pitch for our sustainability story"**  
  `media_pitch_outline({ outlet_type: "tech_press", story_angle: "sustainability initiative", hook: "first in region" })`

- **"Comms brief for beta launch"**  
  `comms_brief({ topic: "beta launch", audience: "early adopters", channels: "email, blog, social" })`

All tools return outlines/placeholders; the agent or user fills in concrete copy.
