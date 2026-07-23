(() => {
  const cssHref = 'account.css';
  if (!document.querySelector(`link[href="${cssHref}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    document.head.appendChild(link);
  }

  const nav = document.querySelector('.site-nav');
  if (nav && !nav.querySelector('a[href="account.html"]')) {
    const accountLink = document.createElement('a');
    accountLink.href = 'account.html';
    accountLink.className = 'account-nav-link';
    accountLink.textContent = 'Sign in';
    const cta = nav.querySelector('.nav-cta');
    nav.insertBefore(accountLink, cta || null);
  }

  const heroActions = document.querySelector('.hero-actions');
  if (heroActions && !heroActions.querySelector('a[href="account.html"]')) {
    const profileLink = document.createElement('a');
    profileLink.href = 'account.html';
    profileLink.className = 'button button-secondary profile-hero-link';
    profileLink.textContent = 'Create your profile';
    heroActions.appendChild(profileLink);
  }

  if (document.querySelector('#profile-preview')) return;

  const anchor = document.querySelector('#badges') || document.querySelector('.process');
  anchor?.insertAdjacentHTML('afterend', `
    <section id="profile-preview" class="profile-preview section-pad">
      <div class="section-shell profile-preview-grid">
        <div class="section-heading reveal" data-reveal="left">
          <p class="eyebrow">Your LVL profile</p>
          <h2>Training should leave a record of who you are becoming.</h2>
          <p>Create a profile to organize goals, coaching notes, session history, mechanics priorities, and progress badges. The current version is a transparent demo while secure authentication is connected.</p>
          <div class="profile-preview-actions">
            <a href="account.html#create" class="button button-primary">Create a profile <span aria-hidden="true">↗</span></a>
            <a href="account.html#signin" class="button button-secondary">Sign in</a>
          </div>
        </div>

        <div class="profile-demo-card reveal" data-reveal="right" aria-label="Example LVL Up athlete profile">
          <div class="profile-demo-top">
            <span class="profile-avatar">JP</span>
            <div><small>ATHLETE PROFILE</small><h3>Josiah P.</h3><p>Libero · Competitive adult</p></div>
            <span class="profile-status">LVL 3</span>
          </div>
          <div class="profile-demo-progress"><span style="width:72%"></span></div>
          <div class="profile-demo-metrics">
            <div><strong>4</strong><span>sessions</span></div>
            <div><strong>3</strong><span>active goals</span></div>
            <div><strong>5</strong><span>badges</span></div>
          </div>
          <div class="profile-demo-focus"><small>CURRENT FOCUS</small><strong>Stay balanced through first contact</strong><span>Next check-in: after two game-speed sessions</span></div>
          <div class="profile-mini-badges" aria-label="Example earned badges"><span>F</span><span>R</span><span>T</span><span class="locked">C</span><span class="locked">L</span></div>
        </div>
      </div>
    </section>`);

  document.querySelectorAll('#profile-preview .reveal').forEach((element) => {
    element.classList.add('visible');
  });
})();