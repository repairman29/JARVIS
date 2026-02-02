/**
 * PR skill — Public Relations and communications: key messages, press outline, social templates, media pitch, comms brief.
 * Returns structured outlines and templates for the agent to use or expand. No external API.
 */

function key_messages({ topic, audience, tone = 'professional', differentiators } = {}) {
  if (!topic || !audience) {
    return { success: false, error: 'topic and audience are required' };
  }
  const outline = {
    success: true,
    topic,
    audience,
    tone,
    key_messages: [
      `[Primary message: one sentence that captures ${topic} for ${audience}]`,
      `[Supporting message 1]`,
      `[Supporting message 2]`,
      `[Supporting message 3 / proof point]`,
    ],
    headline: `[Suggested headline or elevator pitch for ${topic}]`,
  };
  if (differentiators) {
    outline.differentiators = differentiators;
    outline.key_messages.push(`[Differentiator: ${differentiators}]`);
  }
  outline.hint = 'Replace bracketed placeholders with concrete copy. Use these as talking points or for press/social.';
  return outline;
}

function press_release_outline({ topic, audience = 'press and readers', key_points, quote_placeholder } = {}) {
  if (!topic) {
    return { success: false, error: 'topic is required' };
  }
  const sections = [
    '[Lead paragraph: who, what, when, where, why in 1–2 sentences]',
    '[Quote: ' + (quote_placeholder || 'executive/spokesperson') + ']',
    '[Body: 2–3 paragraphs with details, benefits, proof points]',
    '[Boilerplate: short company/product description]',
    '[Contact / media kit]',
  ];
  if (key_points) {
    sections.splice(2, 0, '[Key points: ' + key_points + ']');
  }
  return {
    success: true,
    topic,
    audience,
    headline: `[Headline: news-style, under 80 chars]`,
    subhead: `[Subhead: expand on headline]`,
    sections,
    hint: 'Fill in bracketed sections. Keep lead under 35 words; use AP style for press.',
  };
}

function social_post_templates({ platform = 'generic', topic, tone = 'professional', call_to_action } = {}) {
  if (!topic) {
    return { success: false, error: 'topic is required' };
  }
  const options = [
    `[Short hook for ${topic} — ${platform === 'twitter' ? '~240 chars' : '1–2 sentences'}]`,
    `[Benefit-focused angle for ${topic}]`,
    `[Quote or stat that stands out]`,
  ];
  if (call_to_action) {
    options.push(`[CTA: ${call_to_action}]`);
  }
  return {
    success: true,
    platform,
    topic,
    tone,
    options,
    hint: platform === 'twitter' ? 'Keep under 280 chars; consider thread for more.' : 'Adjust length for platform (LinkedIn: 1–3 short paragraphs).',
  };
}

function media_pitch_outline({ outlet_type = 'any', story_angle, hook } = {}) {
  if (!story_angle) {
    return { success: false, error: 'story_angle is required' };
  }
  return {
    success: true,
    outlet_type,
    story_angle,
    hook: hook || '[One-line hook]',
    subject_line: `[Email subject: specific, newsworthy, under 50 chars]`,
    body_outline: [
      '[Opening: why this matters to this outlet/reader]',
      '[Key angle: ' + story_angle + ']',
      '[Proof or news peg: data, launch, trend]',
      '[Ask: what you want (interview, coverage, quote)]',
      '[Contact and availability]',
    ],
    hint: 'Personalize for each outlet. Keep email under 150 words.',
  };
}

function comms_brief({ topic, audience, channels } = {}) {
  if (!topic || !audience) {
    return { success: false, error: 'topic and audience are required' };
  }
  return {
    success: true,
    topic,
    audience,
    channels: channels || 'press, social, blog, email',
    key_messages: ['[Message 1]', '[Message 2]', '[Message 3]'],
    do: [
      'Lead with news / benefit for audience',
      'Use consistent messaging across channels',
      'Include clear CTA where relevant',
    ],
    dont: [
      'Overpromise or use jargon without explanation',
      'Ignore tone appropriate to channel',
      'Forget to include contact/links',
    ],
    hint: 'Use this as a playbook; expand key_messages with the key_messages tool.',
  };
}

module.exports = {
  key_messages,
  press_release_outline,
  social_post_templates,
  media_pitch_outline,
  comms_brief,
};
