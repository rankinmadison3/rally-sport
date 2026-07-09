const Privacy = () => (
  <div className="max-w-3xl mx-auto p-6 pb-24 space-y-4 text-sm leading-relaxed text-foreground">
    <h1 className="text-3xl font-bold font-display">Privacy Policy</h1>
    <p className="text-muted-foreground">Last updated: July 2026</p>

    <p>
      Rally Sport ("we", "us") provides team management tools for coaches, managers, and players.
      This page describes what we collect, how it is used, and the choices you have. This page is
      maintained by the Rally Sport team and is not an independent certification.
    </p>

    <h2 className="text-lg font-semibold mt-6">Information we collect</h2>
    <ul className="list-disc pl-6 space-y-1">
      <li>Account information: email, password (hashed), display name.</li>
      <li>Profile information you choose to add: photo, bio, phone, jersey number, position, height/weight, date of birth, emergency contact.</li>
      <li>Team activity: messages, feedback responses, tasks, calendar events, morale check-ins, reflections.</li>
      <li>Technical logs necessary to operate the service (IP, device, timestamps).</li>
    </ul>

    <h2 className="text-lg font-semibold mt-6">How we use it</h2>
    <ul className="list-disc pl-6 space-y-1">
      <li>To authenticate you and provide the core features you request.</li>
      <li>To share content with the teammates and coaches you belong to.</li>
      <li>To secure the service and prevent abuse.</li>
    </ul>

    <h2 className="text-lg font-semibold mt-6">Sharing</h2>
    <p>
      We do not sell personal information. Data is stored with our infrastructure provider
      (managed database, storage, and auth). Team content is visible only to members of the
      relevant team based on role permissions and row-level security.
    </p>

    <h2 className="text-lg font-semibold mt-6">Retention & deletion</h2>
    <p>
      You can delete your account at any time from Profile → Delete Account. On deletion, your
      auth record and personal profile data are removed. Some content shared to a team (such as
      chat messages) may remain visible to that team unless the coach removes it.
    </p>

    <h2 className="text-lg font-semibold mt-6">Children</h2>
    <p>
      Rally Sport is intended for users aged 13 and older. Do not create an account if you are
      under 13.
    </p>

    <h2 className="text-lg font-semibold mt-6">Contact</h2>
    <p>
      Questions? Reach us via the <a className="text-primary underline" href="/support">Support page</a>.
    </p>
  </div>
);

export default Privacy;
