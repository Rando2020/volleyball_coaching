const root = document.documentElement;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function volleyballSvg(className = 'lvl-ball') {
  return `
    <svg class="${className}" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="#f8f6ef" stroke="#07111f" stroke-width="5" />
      <path d="M50 4 C62 18 67 31 66 48 C65 63 59 78 48 96" fill="none" stroke="#07111f" stroke-width="5" stroke-linecap="round" />
      <path d="M8 32 C28 29 44 35 55 48 C66 61 72 76 73 89" fill="none" stroke="#07111f" stroke-width="5" stroke-linecap="round" />
      <path d="M18 82 C27 63 41 52 58 48 C73 44 85 45 96 50" fill="none" stroke="#07111f" stroke-width="5" stroke-linecap="round" />
      <path d="M26 10 C35 23 42 34 55 48" fill="none" stroke="#2767ff" stroke-width="5" stroke-linecap="round" />
      <path d="M7 54 C25 52 40 51 58 48" fill="none" stroke="#c9f31d" stroke-width="5" stroke-linecap="round" />
      <path d="M59 48 C73 57 84 67 91 80" fill="none" stroke="#2767ff" stroke-width="5" stroke-linecap="round" />
    </svg>`;
}

function officialCourtSvg(className = 'accurate-court') {
  return `
    <svg class="${className}" viewBox="0 0 2100 1200" role="img" aria-label="Regulation indoor volleyball court shown in the correct 18 meter by 9 meter ratio, divided into two 9 meter square courts with attack lines 3 meters from the center line">
      <rect class="free-zone" x="20" y="20" width="2060" height="1160" rx="42" />
      <rect class="court-floor" x="150" y="150" width="1800" height="900" />
      <rect class="front-zone" x="750" y="150" width="300" height="900" />
      <rect class="front-zone" x="1050" y="150" width="300" height="900" />
      <line class="court-line" x1="750" y1="150" x2="750" y2="1050" />
      <line class="net-line" x1="1050" y1="135" x2="1050" y2="1065" />
      <line class="court-line" x1="1350" y1="150" x2="1350" y2="1050" />
      <text class="zone-label" x="380" y="625">BACK COURT</text>
      <text class="zone-label" x="815" y="625">3M</text>
      <text class="zone-label" x="1122" y="625">3M</text>
      <text class="zone-label" x="1490" y="625">BACK COURT</text>
    </svg>`;
}

function addEnhancementStyles() {
  if (document.querySelector('link[href="lvlup-enhancements.css"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'lvlup-enhancements.css';
  document.head.appendChild(link);
}

function rebrandSite() {
  addEnhancementStyles();
  document.title = 'LVL Up Volleyball | Coaching with Josiah';
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.content = 'LVL Up volleyball coaching in Milwaukee for athletes of all ages, teams, and coaches. Private training, mechanics review, video analysis, coach consulting, and community-rate sessions.';
  }

  document.querySelectorAll('.brand').forEach((brand) => {
    brand.innerHTML = `
      <span class="brand-mark">LVL</span>
      <span class="brand-copy"><strong>LVL Up</strong><small>with Josiah</small></span>`;
  });

  const navigation = document.querySelector('.site-nav');
  if (navigation) {
    navigation.innerHTML = `
      <a href="#who">Who I Coach</a>
      <a href="#training">Training</a>
      <a href="#coach-lab">For Coaches</a>
      <a href="#mindset">Mindset</a>
      <a href="#pricing">Pricing</a>
      <a href="index.html" class="nav-cta">Training calendar</a>`;
  }

  const hero = document.querySelector('.hero');
  if (hero) {
    const eyebrow = hero.querySelector('.eyebrow');
    const headline = hero.querySelector('h1');
    const lead = hero.querySelector('.hero-lead');
    const actions = hero.querySelector('.hero-actions');
    const proof = hero.querySelector('.hero-proof');
    const courtCard = hero.querySelector('.court-card');
    const scrollCue = hero.querySelector('.scroll-cue');

    if (eyebrow) eyebrow.textContent = 'Milwaukee volleyball coaching for every age and stage';
    if (headline) {
      headline.setAttribute('aria-label', 'Build the skill. Own the next ball. Level up.');
      headline.innerHTML = `
        <span class="headline-line hero-enter" style="--enter-delay: 80ms">Build the skill.</span>
        <span class="headline-line hero-enter" style="--enter-delay: 160ms">Own the next ball.</span>
        <span class="headline-line hero-enter accent-line" style="--enter-delay: 240ms">LVL Up.</span>`;
    }
    if (lead) {
      lead.textContent = 'Technical coaching, video feedback, team culture, and accountable development for players, parents, teams, and coaches. Meet the athlete where they are, then build the next level that actually matters.';
    }
    if (actions) {
      actions.innerHTML = `
        <a href="#contact" class="button button-primary magnetic">Start your LVL <span aria-hidden="true">↗</span></a>
        <a href="#training" class="button button-secondary">Explore training</a>`;
    }
    if (proof) {
      proof.innerHTML = `
        <div><strong><span data-count="20">20</span>+ years</strong><span>playing volleyball</span></div>
        <div><strong><span data-count="5">5</span> years</strong><span>playing at UWM</span></div>
        <div><strong><span data-count="2.5">2.5</span> years</strong><span>player development leadership</span></div>
        <div><strong>All ages</strong><span>new players through competitive adults</span></div>`;
    }
    if (courtCard) {
      courtCard.classList.add('lvl-court-card');
      courtCard.innerHTML = `
        <div class="court-glow" aria-hidden="true"></div>
        <div class="court-specs"><span>18m × 9m</span><span>3m attack lines</span><span>regulation proportions</span></div>
        <div class="accurate-court-wrap">${officialCourtSvg()}</div>
        ${volleyballSvg()}
        <div class="court-caption"><strong>See the whole court. Solve the next ball.</strong><span>Original court graphic built from current FIVB dimensions, not copied from Hudl or another platform.</span></div>`;
    }
    if (scrollCue) {
      scrollCue.href = '#who';
      scrollCue.setAttribute('aria-label', 'Scroll to choose your training path');
      scrollCue.querySelector('span').textContent = 'Find your next level';
    }
  }

  document.querySelectorAll('.ticker-group').forEach((group) => {
    group.innerHTML = '<span>All Ages</span><span>Private Training</span><span>Mechanics</span><span>Coach Development</span><span>Video Review</span><span>Team Culture</span><span>Accountability</span><span>Game IQ</span>';
  });
}

function insertAudienceSection() {
  if (document.querySelector('#who')) return;
  const gamePlan = document.querySelector('#game-plan');
  gamePlan?.insertAdjacentHTML('beforebegin', `
    <section id="who" class="audience section-pad">
      <div class="section-shell">
        <div class="section-heading reveal" data-reveal="up">
          <p class="eyebrow">Choose your path</p>
          <h2>One coaching philosophy. Different starting points.</h2>
          <p>Great coaching should not require you to already be great. LVL Up is designed for athletes learning their first platform, experienced players chasing consistency, teams building trust, and coaches who want another set of eyes.</p>
        </div>
        <div class="audience-grid stagger-group">
          <article class="audience-card reveal" data-reveal="up"><span>01</span><h3>Youth and first-time athletes</h3><p>Age-appropriate foundations, movement literacy, confidence, and a healthy relationship with mistakes.</p></article>
          <article class="audience-card reveal" data-reveal="up"><span>02</span><h3>Teen and competitive players</h3><p>Position work, tryout preparation, game-speed decision-making, mechanics, and pressure-tested reps.</p></article>
          <article class="audience-card reveal" data-reveal="up"><span>03</span><h3>Adult and returning players</h3><p>Efficient improvement without pretending your body, schedule, or goals are the same as a full-time athlete's.</p></article>
          <article class="audience-card reveal" data-reveal="up"><span>04</span><h3>Coaches and full teams</h3><p>Practice design, feedback systems, player development, team accountability, film review, and outside perspective.</p></article>
        </div>
      </div>
    </section>`);
}

function updateCoachingApproach() {
  const section = document.querySelector('#game-plan');
  if (!section) return;
  const heading = section.querySelector('.section-heading');
  if (heading) {
    heading.innerHTML = `
      <p class="eyebrow">The LVL Up method</p>
      <h2>Film and data only matter when they change the next rep.</h2>
      <p>The best video platforms make moments easy to find. My job is the human layer: identify the pattern, explain it clearly, and turn it into a progression the athlete can actually use.</p>`;
  }
  const court = section.querySelector('.story-court');
  if (court) {
    court.classList.add('lvl-story-court');
    court.innerHTML = `
      ${officialCourtSvg('story-court-svg')}
      <span class="story-target"></span>
      <span class="story-ball">${volleyballSvg('story-ball-art')}</span>
      <span class="story-player player-a"></span>
      <span class="story-player player-b"></span>
      <span class="story-player player-c"></span>
      <div class="story-status"><span class="story-kicker">THE NEXT BALL</span><strong id="story-status-text">READ IT EARLY</strong></div>`;
  }

  const storyContent = [
    ['READ', 'See the play before the ball arrives.', 'Use the server, setter, hitter, block, and available space to begin moving from information instead of panic.'],
    ['MOVE', 'Arrive balanced enough to keep options.', 'Efficient footwork gets the body behind the ball without creating unnecessary stress, wasted steps, or a single forced solution.'],
    ['CONTROL', 'Make the next contact repeatable.', 'Control the platform, arm path, tempo, and decision so the next touch becomes easier for you and everyone around you.']
  ];
  section.querySelectorAll('[data-story-step]').forEach((step, index) => {
    const content = storyContent[index];
    if (!content) return;
    step.querySelector('.story-label').textContent = content[0];
    step.querySelector('h3').textContent = content[1];
    step.querySelector('div > p:last-child').textContent = content[2];
  });
}

function updateAboutSection() {
  const about = document.querySelector('#about');
  if (!about) return;
  const heading = about.querySelector('.section-heading');
  if (heading) {
    heading.innerHTML = `
      <p class="eyebrow">What I bring to the table</p>
      <h2>Technical detail without losing the person in front of me.</h2>
      <p>I have played since middle school as a setter, club libero, five-year UWM player, tournament competitor, and adult-league coach. I also served two and a half years as MGVA Player Development Director. That range helps me translate the game across ages, positions, learning styles, and competitive levels.</p>`;
  }
  const cards = [
    ['01', 'Setter and libero perspective', 'I understand how first contact, court organization, tempo, and decision-making connect instead of treating each skill as an isolated motion.'],
    ['02', 'Player development leadership', 'Two and a half years directing player development for MGVA sharpened how I build access, progression, and confidence across very different athletes.'],
    ['03', 'Beginners are a specialty', 'I have helped players and teams move from zero experience to competent, playable volleyball without overwhelming them or skipping foundations.'],
    ['04', 'Competitive results', 'I have coached adult-league athletes and teams who went on to win medals, with improvements that held up under pressure rather than only during drills.'],
    ['05', 'Mechanics and pattern recognition', 'I look beyond the arm or the contact point to the full sequence: approach, timing, trunk, shoulder position, hand path, workload, and what happens next.'],
    ['06', 'A network, not an ego', 'When an athlete needs a specialty beyond my scope, I can collaborate with or refer to experienced and professional volleyball contacts instead of pretending I am the answer to everything.']
  ];
  about.querySelectorAll('.feature-card').forEach((card, index) => {
    const content = cards[index];
    if (!content) return;
    card.querySelector(':scope > span').textContent = content[0];
    card.querySelector('h3').textContent = content[1];
    card.querySelector('p').textContent = content[2];
  });
}

function insertMindsetSection() {
  if (document.querySelector('#mindset')) return;
  const about = document.querySelector('#about');
  about?.insertAdjacentHTML('afterend', `
    <section id="mindset" class="mindset section-pad">
      <div class="section-shell mindset-grid">
        <div class="section-heading reveal" data-reveal="left">
          <p class="eyebrow">The mentality</p>
          <h2>Accountability without humiliation.</h2>
          <p>Intensity is useful. Anger can contain information and energy. The standard is learning how to direct it into preparation, communication, and the next controllable action instead of blame, shutdown, or destruction.</p>
        </div>
        <div class="principles stagger-group">
          <article class="principle reveal" data-reveal="right"><span>1</span><div><h3>Own the next rep</h3><p>Take responsibility for what is controllable without pretending every outcome is your fault.</p></div></article>
          <article class="principle reveal" data-reveal="right"><span>2</span><div><h3>Turn emotion into direction</h3><p>Use frustration to identify the standard, adjustment, conversation, or recovery decision that comes next.</p></div></article>
          <article class="principle reveal" data-reveal="right"><span>3</span><div><h3>Become playable</h3><p>Skill matters, but so do communication, effort, emotional recovery, reliability, and whether teammates trust you under pressure.</p></div></article>
          <article class="principle reveal" data-reveal="right"><span>4</span><div><h3>Raise the room</h3><p>The highest level is not only playing better. It is making the people beside you more confident, prepared, and capable.</p></div></article>
        </div>
      </div>
    </section>`);
}

function updateServices() {
  const training = document.querySelector('#training');
  if (!training) return;
  const heading = training.querySelector('.section-heading');
  if (heading) {
    heading.innerHTML = `
      <div><p class="eyebrow">Training options</p><h2>Choose the problem. Build the next level.</h2></div>
      <p>Each service ends with priorities you can act on. No vague advice, no ten-drill overload, and no pretending every player needs the same cue.</p>`;
  }
  const serviceList = training.querySelector('.service-list');
  if (serviceList) {
    serviceList.innerHTML = `
      <article class="service-row reveal" data-reveal="left"><div class="service-number">01</div><div><span class="service-tag">All ages</span><h3>Private athlete training</h3><p>One-on-one development for foundations, position work, tryouts, confidence, game IQ, or a specific skill that is not transferring into play.</p></div><ul><li>60 minutes</li><li>Individual progression</li><li>Clear next steps</li></ul><span class="service-arrow" aria-hidden="true">↗</span></article>
      <article class="service-row reveal" data-reveal="right"><div class="service-number">02</div><div><span class="service-tag">New offering</span><h3>Mechanics and arm-stress review</h3><p>A coaching assessment of serving or attacking mechanics, timing, kinetic-chain use, and workload patterns that may be contributing to unnecessary arm stress.</p><div class="pain-safety-note">This is sports coaching, not medical diagnosis, rehabilitation, or treatment. New, severe, worsening, or persistent pain should be evaluated by a qualified healthcare professional before training continues.</div></div><ul><li>In-person or video</li><li>Full-sequence review</li><li>Lower-stress progression</li></ul><span class="service-arrow" aria-hidden="true">↗</span></article>
      <article class="service-row reveal" data-reveal="left"><div class="service-number">03</div><div><span class="service-tag">2 to 6 athletes</span><h3>Small-group training</h3><p>Individual feedback with more live reads, competition, and interaction than a private session can create.</p></div><ul><li>Position or skill focus</li><li>Game-speed constraints</li><li>Shared accountability</li></ul><span class="service-arrow" aria-hidden="true">↗</span></article>
      <article class="service-row reveal" data-reveal="right"><div class="service-number">04</div><div><span class="service-tag">Teams</span><h3>Team clinics and culture sessions</h3><p>Target a technical system, first contact, defense, transition, serving pressure, communication, accountability, or how the team responds when frustrated.</p></div><ul><li>90 or 120 minutes</li><li>Coach consultation</li><li>Practice recap</li></ul><span class="service-arrow" aria-hidden="true">↗</span></article>
      <article class="service-row reveal" data-reveal="left"><div class="service-number">05</div><div><span class="service-tag">Remote</span><h3>Video and match review</h3><p>Timestamped feedback that moves from clips and patterns to three priorities, specific cues, and a drill or practice plan.</p></div><ul><li>Skill clips or full match</li><li>Voice-over breakdown</li><li>Action plan</li></ul><span class="service-arrow" aria-hidden="true">↗</span></article>
      <article class="service-row reveal" data-reveal="right"><div class="service-number">06</div><div><span class="service-tag">For coaches</span><h3>Coach-to-coach development</h3><p>An outside perspective on practice design, feedback, athlete buy-in, mechanics, systems, player development, or a team problem you cannot quite name.</p></div><ul><li>Private consultation</li><li>Practice or film review</li><li>Staff clinic option</li></ul><span class="service-arrow" aria-hidden="true">↗</span></article>`;
  }
}

function insertCoachLab() {
  if (document.querySelector('#coach-lab')) return;
  const training = document.querySelector('#training');
  training?.insertAdjacentHTML('afterend', `
    <section id="coach-lab" class="coach-lab section-pad">
      <div class="section-shell coach-lab-grid">
        <div class="section-heading reveal" data-reveal="left">
          <p class="eyebrow">Coaching coaches</p>
          <h2>You do not need another library of drills. You need clarity on what to do Monday.</h2>
          <p>Hudl and Balltime are excellent at helping coaches find moments and patterns. LVL Up focuses on the next translation: what the clip means, how to teach it, what language will land, and how to build the next practice around it.</p>
        </div>
        <div class="coach-lab-panel reveal" data-reveal="right">
          <h3>Coach consultation, $125</h3>
          <p>Seventy-five focused minutes for one team, practice, system, athlete-development, mechanics, or culture problem.</p>
          <ul><li>Pre-call context or film review</li><li>Live working session</li><li>Written priorities and next-practice outline</li><li>Optional follow-up check-in</li></ul>
          <a class="button button-secondary" href="#contact">Bring me the problem</a>
        </div>
      </div>
    </section>`);
}

function updatePricing() {
  const pricing = document.querySelector('#pricing');
  if (!pricing) return;
  const heading = pricing.querySelector('.section-heading');
  if (heading) {
    heading.innerHTML = `
      <p class="eyebrow">Transparent pricing</p>
      <h2>Professional coaching without pretending I run a two-million-dollar club.</h2>
      <p class="pricing-note">Court rental, when required, is quoted separately. For minors, scheduling and payment must include a parent or guardian.</p>`;
  }
  const grid = pricing.querySelector('.pricing-grid');
  if (grid) {
    grid.innerHTML = `
      <article class="price-card reveal" data-reveal="up"><p class="price-label">Private</p><h3><span>$85</span> / session</h3><p>One athlete, 60 minutes</p><ul><li>Individual assessment</li><li>Skill or position focus</li><li>Written next steps</li></ul><a href="#contact" class="button button-secondary">Book private</a></article>
      <article class="price-card featured reveal" data-reveal="up"><div class="popular">Best starting block</div><p class="price-label">3-session development pack</p><h3><span>$225</span> total</h3><p>Three private 60-minute sessions</p><ul><li>Baseline and goal setting</li><li>Progressive plan</li><li>Between-session priorities</li></ul><a href="#contact" class="button button-primary magnetic">Start a training block</a></article>
      <article class="price-card mechanics-price reveal" data-reveal="up"><p class="price-label">Mechanics review</p><h3><span>$95</span> / session</h3><p>Serving or attacking, 75 minutes</p><ul><li>Full-sequence assessment</li><li>Stress-reduction priorities</li><li>Video notes when available</li></ul><a href="#contact" class="button button-secondary">Review mechanics</a></article>
      <article class="price-card reveal" data-reveal="up"><p class="price-label">Small group</p><h3><span>$40</span> / athlete</h3><p>2 to 4 athletes, 60 minutes</p><ul><li>More live reads</li><li>Individual correction</li><li>Shared skill focus</li></ul><a href="#contact" class="button button-secondary">Train together</a></article>
      <article class="price-card reveal" data-reveal="up"><p class="price-label">Team clinic</p><h3><span>$275</span> / clinic</h3><p>Up to 14 athletes, 90 minutes</p><ul><li>Pre-clinic coach call</li><li>Custom practice design</li><li>Staff recap</li></ul><a href="#contact" class="button button-secondary">Plan a clinic</a></article>
      <article class="price-card coach-price reveal" data-reveal="up"><p class="price-label">Video review</p><h3><span>From $55</span></h3><p>Skill clips or full-match analysis</p><ul><li>$55 skill review</li><li>$175 full team match</li><li>Timestamped action plan</li></ul><a href="#contact" class="button button-secondary">Submit film</a></article>`;
  }
  if (!pricing.querySelector('.sliding-scale')) {
    grid?.insertAdjacentHTML('afterend', `
      <div class="sliding-scale reveal" data-reveal="up">
        <div><h3>Community-rate sessions</h3><p>Cost should not automatically end the conversation. I reserve a limited number of reduced-rate private sessions at $45 to $70 based on need and availability. No essay and no proof of hardship are required. Select “Community rate” in the form and tell me what would make training possible.</p></div>
        <a href="#contact" class="button button-secondary">Request a community rate</a>
      </div>`);
  }
}

function insertBadgesSection() {
  if (document.querySelector('#badges')) return;
  const process = document.querySelector('.process');
  process?.insertAdjacentHTML('afterend', `
    <section id="badges" class="badges-section section-pad">
      <div class="section-shell">
        <div class="section-heading reveal" data-reveal="up">
          <p class="eyebrow">The LVL path</p>
          <h2>Progress should be visible beyond wins and kills.</h2>
          <p>Badges create language for development. They recognize the technical, competitive, and interpersonal traits that make someone better to play with.</p>
        </div>
        <div class="badge-path stagger-group">
          <article class="lvl-badge reveal" data-reveal="up"><span class="badge-icon">F</span><h3>Foundation</h3><p>Builds safe, understandable movement and can repeat the basic shape.</p></article>
          <article class="lvl-badge reveal" data-reveal="up"><span class="badge-icon">R</span><h3>Reliable</h3><p>Delivers the skill with enough consistency that teammates can build around it.</p></article>
          <article class="lvl-badge reveal" data-reveal="up"><span class="badge-icon">C</span><h3>Competitive</h3><p>Makes useful choices at game speed and recovers after mistakes.</p></article>
          <article class="lvl-badge reveal" data-reveal="up"><span class="badge-icon">T</span><h3>Teammate</h3><p>Communicates, stays playable, and responds to frustration without spreading it.</p></article>
          <article class="lvl-badge reveal" data-reveal="up"><span class="badge-icon">L</span><h3>Leader</h3><p>Raises the standard while making other people more capable and confident.</p></article>
        </div>
        <p class="badge-disclaimer">The badge framework is live as a coaching tool. Digital accounts and athlete profiles are a planned second phase, not an active feature yet.</p>
      </div>
    </section>`);
}

function insertFaq() {
  if (document.querySelector('#faq')) return;
  const contact = document.querySelector('#contact');
  contact?.insertAdjacentHTML('beforebegin', `
    <section id="faq" class="faq section-pad">
      <div class="section-shell faq-grid">
        <div class="section-heading reveal" data-reveal="left"><p class="eyebrow">Before you reach out</p><h2>Clear expectations make better training.</h2></div>
        <div class="faq-list reveal" data-reveal="right">
          <details class="faq-item"><summary>Do you coach complete beginners and adults?</summary><p>Yes. Sessions are adjusted for age, experience, goals, physical readiness, and how quickly the athlete processes new information.</p></details>
          <details class="faq-item"><summary>Can you fix shoulder or arm pain?</summary><p>I can assess visible volleyball mechanics and workload patterns and coach lower-stress movement options. I do not diagnose injuries or replace a physician, athletic trainer, or physical therapist. Persistent, worsening, sudden, or severe pain needs medical evaluation.</p></details>
          <details class="faq-item"><summary>Can you work with my coach or coaching staff?</summary><p>Yes. Coach consultations can cover film, practice design, systems, mechanics, feedback, player development, culture, or one recurring problem that is limiting the team.</p></details>
          <details class="faq-item"><summary>How does the sliding scale work?</summary><p>Select the community-rate option in the form and share the range that is realistic. Reduced-rate spots are limited, but the process is intentionally simple and respectful.</p></details>
        </div>
      </div>
    </section>`);
}

function updateProcess() {
  const process = document.querySelector('.process');
  if (!process) return;
  const heading = process.querySelector('.section-heading');
  if (heading) heading.innerHTML = '<p class="eyebrow">How it works</p><h2>Observe. Prioritize. Train. Verify.</h2>';
  const items = [
    ['1', 'Tell me where you are', 'Share the athlete or team level, goal, frustration, availability, and any relevant film.'],
    ['2', 'Find the highest-impact pattern', 'We separate the visible symptom from the skill, decision, timing, workload, or communication pattern underneath it.'],
    ['3', 'Build and verify the next level', 'Train the priority, return it to game context, and leave with a clear way to measure whether it is actually changing.']
  ];
  process.querySelectorAll('.process-list li').forEach((item, index) => {
    const content = items[index];
    if (!content) return;
    item.querySelector(':scope > span').textContent = content[0];
    item.querySelector('h3').textContent = content[1];
    item.querySelector('p').textContent = content[2];
  });
}

function updateContact() {
  const contact = document.querySelector('#contact');
  if (!contact) return;
  const copy = contact.querySelector('.contact-panel > div');
  if (copy) {
    copy.innerHTML = `
      <p class="eyebrow">Start your LVL</p>
      <h2>Tell me who you are and what needs to change.</h2>
      <p>I will respond with the best-fit service, realistic next step, location options, and available times. For athletes under 18, a parent or guardian should complete the form.</p>
      <div class="contact-links"><a href="mailto:coachziahvolleyball@gmail.com">coachziahvolleyball@gmail.com</a><span>Milwaukee, Wisconsin and surrounding areas, with remote video and coach consultations available</span></div>`;
  }
  const form = contact.querySelector('#interest-form');
  if (form) {
    form.innerHTML = `
      <div class="form-row">
        <label>Name<input type="text" name="name" autocomplete="name" required /></label>
        <label>Email<input type="email" name="email" autocomplete="email" required /></label>
      </div>
      <div class="form-row">
        <label>Phone number<input type="tel" name="phone" autocomplete="tel" required /></label>
        <label>I am reaching out as<select name="role" required><option value="">Choose one</option><option>Player</option><option>Parent or guardian</option><option>Coach</option><option>Team organizer</option></select></label>
      </div>
      <div class="form-row">
        <label>Age range<select name="ageRange" required><option value="">Choose one</option><option>Under 12</option><option>12 to 14</option><option>15 to 18</option><option>Adult</option><option>Coach or staff</option></select></label>
        <label>Volleyball experience<select name="experience" required><option value="">Choose one</option><option>Completely new</option><option>Beginner</option><option>Intermediate</option><option>Competitive</option><option>College or advanced adult</option><option>Coach</option></select></label>
      </div>
      <label>I am interested in<select name="service" required><option value="">Choose a service</option><option>Private athlete training</option><option>Mechanics and arm-stress review</option><option>Small-group training</option><option>Team clinic or culture session</option><option>Skill video review</option><option>Team film review</option><option>Coach consultation</option></select></label>
      <label>Position, goals, concerns, and availability<textarea name="message" rows="5" required></textarea></label>
      <label class="form-check-row"><input type="checkbox" name="communityRate" value="Yes" /><span>I would like to discuss a community-rate session.</span></label>
      <label class="form-check-row"><input type="checkbox" name="profileInterest" value="Yes" /><span>I am interested in a future LVL athlete profile and badge system.</span></label>
      <p class="form-helper">Submitting opens your email app with this information filled in. No account is created and the site does not store your information.</p>
      <button type="submit" class="button button-primary magnetic">Send training request <span aria-hidden="true">↗</span></button>
      <p id="form-status" class="form-status" role="status"></p>`;
  }
}

function updateFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;
  const paragraphs = footer.querySelectorAll('p');
  if (paragraphs[0]) paragraphs[0].textContent = 'Build the skill. Own the next ball. Raise the room.';
  if (paragraphs[1]) paragraphs[1].innerHTML = `© <span id="year"></span> LVL Up Volleyball`;
}

function initializeContent() {
  rebrandSite();
  insertAudienceSection();
  updateCoachingApproach();
  updateAboutSection();
  insertMindsetSection();
  updateServices();
  insertCoachLab();
  updatePricing();
  updateProcess();
  insertBadgesSection();
  insertFaq();
  updateContact();
  updateFooter();
}

initializeContent();

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const siteHeader = document.querySelector('.site-header');
const progressLine = document.querySelector('.scroll-progress-line');
const progressBall = document.querySelector('.scroll-progress-ball');
const processBall = document.querySelector('.process-ball');

menuButton?.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
);

document.querySelectorAll('.stagger-group').forEach((group) => {
  group.querySelectorAll('.reveal').forEach((element, index) => {
    element.style.setProperty('--stagger-delay', `${Math.min(index * 90, 360)}ms`);
  });
});

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.querySelector('#year').textContent = new Date().getFullYear();

let ticking = false;

function updateScrollEffects() {
  const scrollTop = window.scrollY;
  const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max(scrollTop / scrollable, 0), 1);

  root.style.setProperty('--scroll', progress.toFixed(4));
  siteHeader?.classList.toggle('scrolled', scrollTop > 28);

  if (progressLine) {
    progressLine.style.width = '100%';
    progressLine.style.transform = `scaleX(${progress})`;
  }

  if (progressBall) {
    progressBall.style.left = `${progress * 100}%`;
    progressBall.style.transform = `translate(-50%, -50%) rotate(${progress * 720}deg)`;
  }

  const process = document.querySelector('.process');
  if (process) {
    const rect = process.getBoundingClientRect();
    const processProgress = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0), 1);

    if (processBall) {
      processBall.style.left = `${8 + processProgress * 76}%`;
      processBall.style.transform = `rotate(${processProgress * 540}deg)`;
    }
  }

  document.querySelectorAll('[data-depth]').forEach((element) => {
    if (prefersReducedMotion || window.innerWidth < 980) return;
    const depth = Number(element.dataset.depth || 0);
    const rect = element.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const elementCenter = rect.top + rect.height / 2;
    const offset = (viewportCenter - elementCenter) * depth;
    element.style.transform = `translate3d(0, ${offset}px, 0)`;
  });

  ticking = false;
}

function requestScrollUpdate() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateScrollEffects);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate);
updateScrollEffects();

const storyCourt = document.querySelector('.story-court');
const storyBall = document.querySelector('.story-ball');
const storyStatusText = document.querySelector('#story-status-text');
const storySteps = [...document.querySelectorAll('[data-story-step]')];
const storyStates = [
  { x: '15%', y: '70%', rotate: '-20deg', label: 'READ IT EARLY' },
  { x: '47%', y: '50%', rotate: '155deg', label: 'ARRIVE BALANCED' },
  { x: '79%', y: '30%', rotate: '330deg', label: 'CONTROL THE OUTCOME' },
];

function setStoryStage(stage) {
  const state = storyStates[stage];
  if (!storyCourt || !storyBall || !storyStatusText || !state) return;

  storyCourt.dataset.stage = String(stage);
  storyBall.style.setProperty('--ball-x', state.x);
  storyBall.style.setProperty('--ball-y', state.y);
  storyBall.style.setProperty('--ball-rotate', state.rotate);
  storyStatusText.textContent = state.label;
  storySteps.forEach((step, index) => step.classList.toggle('is-active', index === stage));
}

const storyObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible) setStoryStage(Number(visible.target.dataset.storyStep));
  },
  { threshold: [0.35, 0.5, 0.65], rootMargin: '-16% 0px -30% 0px' }
);

storySteps.forEach((step) => storyObserver.observe(step));
setStoryStage(0);

const navSections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
);

navSections.forEach((section) => sectionObserver.observe(section));

if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.interactive-tilt').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 8;
      const rotateX = (0.5 - y) * 8;

      card.style.setProperty('--pointer-x', `${x * 100}%`);
      card.style.setProperty('--pointer-y', `${y * 100}%`);
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  document.querySelectorAll('.interactive-glow').forEach((panel) => {
    panel.addEventListener('pointermove', (event) => {
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty('--glow-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      panel.style.setProperty('--glow-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
  });

  document.querySelectorAll('.magnetic').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      button.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
    });

    button.addEventListener('pointerleave', () => {
      button.style.transform = '';
    });
  });
}

const form = document.querySelector('#interest-form');
const formStatus = document.querySelector('#form-status');

form?.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const name = data.get('name');
  const email = data.get('email');
  const phone = data.get('phone');
  const role = data.get('role');
  const ageRange = data.get('ageRange');
  const experience = data.get('experience');
  const service = data.get('service');
  const message = data.get('message');
  const communityRate = data.get('communityRate') || 'No';
  const profileInterest = data.get('profileInterest') || 'No';

  const subject = encodeURIComponent(`LVL Up volleyball request: ${service}`);
  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nReaching out as: ${role}\nAge range: ${ageRange}\nExperience: ${experience}\nService: ${service}\nCommunity rate requested: ${communityRate}\nFuture profile interest: ${profileInterest}\n\nGoals, concerns, and availability:\n${message}`
  );

  formStatus.textContent = 'Opening your email app with the request filled in.';
  window.location.href = `mailto:coachziahvolleyball@gmail.com?subject=${subject}&body=${body}`;
});