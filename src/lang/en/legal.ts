export default {
    contactTitle: 'Contact',
    contactText: 'For a legal question, a complaint or a request about your personal data, contact Revolis at',
    notices: {
        account: 'Read the service rules and information about your personal data:',
        creator: 'Before setting up payments with Stripe, read:',
        purchase: 'Before continuing to Stripe, read:',
    },
    referencesTitle: 'Privacy information from our service providers and the CNIL',
    references: [
        ['Cloudflare', 'https://www.cloudflare.com/privacypolicy/'],
        ['GitHub', 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement'],
        ['Stripe', 'https://stripe.com/privacy'],
        ['LWS (PDF)', 'https://aide.lws.fr/doc/cgv_01_07_2020/Info_legales_Clause_confidentialite_RGPD.pdf'],
        [
            'CNIL: your personal data rights',
            'https://www.cnil.fr/fr/mes-demarches/les-droits-pour-maitriser-vos-donnees-personnelles',
        ],
    ],
    terms: {
        title: 'Terms of use',
        lead: 'Rules for using KraftInk accounts and the resource Market.',
        sections: [
            {
                title: 'Site operator',
                paragraphs: [
                    'KraftInk is operated by Nicolas Dusserre, a French sole trader trading as Revolis, at 41 rue de Lassun, 64800 Montaut, France. SIREN: 908 931 157. SIRET: 908 931 157 00014. Intra-community VAT number: FR02908931157.',
                    'Nicolas Dusserre is the publication director.',
                ],
            },
            {
                title: 'Hosting',
                paragraphs: [
                    'The website is hosted by Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, United States. Telephone: +1 (650) 319-8930. Website: www.cloudflare.com.',
                ],
            },
            {
                title: 'Accounts and access',
                paragraphs: [
                    'Provide accurate account details and keep your password and site key confidential. You can sign in with your username or email address, or link your GitHub account. A verified email address is required for purchases and resource publication.',
                    'Do not impersonate another person, circumvent access restrictions or disrupt the service. The team may restrict or suspend an account in response to abuse or a security risk.',
                ],
            },
            {
                title: 'Resources and sellers',
                paragraphs: [
                    'The Market lists free resources, resources sold through KraftInk and commercial resources available from external websites. External purchases are handled by the provider linked from the resource page.',
                    'Creators must hold the rights to distribute their resources and provide accurate descriptions, versions, prices and licence conditions. They are responsible for the legality and safety of their files, customer support, applicable taxes and their invoicing obligations.',
                    'Each resource and update submitted through KraftInk requires approval before publication. Moderation does not guarantee that a resource is free from every defect or security vulnerability.',
                ],
            },
            {
                title: 'Purchases and payments',
                paragraphs: [
                    'Prices include applicable tax and are shown with the resource concerned before payment. Stripe Tax calculates tax using the seller’s tax configuration and the buyer’s billing details. Payments for resources sold through KraftInk are processed by Stripe on the seller’s connected account. The seller is responsible for the sale. Stripe applies its own payment and seller onboarding conditions.',
                    'Access is linked to the purchasing account after payment has been confirmed. Stripe generates an invoice in the seller’s name for each purchase, accessible from your orders. For a business purchase, enter your company name, billing address and VAT number if applicable on Stripe’s payment page.',
                    'For a question about a resource, support, a refund or the performance of the sale, contact the seller. You can also report a problem with the Market to the KraftInk team. These terms do not exclude applicable consumer rights, including legal guarantees and any right of withdrawal. The seller’s applicable sale conditions remain separate from these terms of use.',
                ],
            },
            {
                title: 'Using purchased resources',
                paragraphs: [
                    'Paid archives purchased through KraftInk are downloaded by the CMS using the account’s site key and the configured IP permissions. Keep the site key private and comply with the resource’s licence.',
                    'An account normally has one allowed IP address, which can be changed once every three days. Administrators can adjust the quota or define allowed network ranges instead of this address list.',
                ],
            },
            {
                title: 'Moderation and withdrawal',
                paragraphs: [
                    'The moderation team may reject a submission or update and withdraw a resource from new sales.',
                    'A normal withdrawal preserves existing purchase records and access rights. For a security risk or another serious issue, an administrator can block downloads and request deactivation of the resource on CMS installations that installed it from this Market. Purchase and moderation history is retained.',
                    'Report harmful content, a rights infringement or a security issue to the team. A resource’s withdrawal does not remove the seller’s applicable legal obligations towards buyers.',
                ],
            },
        ],
    },
    privacy: {
        title: 'Privacy policy',
        lead: 'How KraftInk uses personal data for accounts, purchases, resource publication and security.',
        sections: [
            {
                title: 'Controller and contact',
                paragraphs: [
                    'Nicolas Dusserre, a sole trader trading as Revolis at 41 rue de Lassun, 64800 Montaut, France, is responsible for the processing described here. His SIREN is 908 931 157. You can contact him at contact@revolis.fr about your personal data.',
                ],
            },
            {
                title: 'Data processed',
                paragraphs: [
                    'Account data includes your username, email address, password hash where a password is used, verification status, user role and account creation or modification dates. When a new account is created, we also record when the terms of use were accepted and which version was accepted. We do not store your password in plain text.',
                    'If you enable two-step verification, we store the authenticator secret in encrypted form, hashes of your recovery codes, and the dates and counters needed to check codes and prevent reuse. The setup key and new recovery codes are displayed only when they are generated.',
                    'If you choose GitHub sign-in, GitHub provides your account identifier, public profile details and a verified email address used to identify or create your KraftInk account.',
                    'CMS access uses a hash and an identifying prefix of your site key, the allowed IP addresses or network ranges and their change history. Security and moderation records can include the acting account, IP address, action, target, reason and date.',
                    'Purchases include the buyer and seller identifiers, resource, amount, currency, payment status, Stripe references and invoice links. Seller data includes the connected Stripe account and information such as trading name, country, business type and payment activation status. Payment card details and the billing information entered on Stripe’s pages are collected by Stripe. KraftInk does not store full card numbers.',
                    'Published resource information, submitted archives and images, review decisions and messages sent to support are also processed to operate the Market and respond to requests.',
                ],
            },
            {
                title: 'Purposes and legal bases',
                paragraphs: [
                    'Account management, sign-in, purchases, access to purchased resources, creator payments and service messages are necessary to provide the services you request and perform the relevant contract or pre-contractual steps.',
                    'Fraud prevention, rate limiting, access checks, security records and moderation serve our legitimate interest in protecting users and the service. Transaction records may also be processed to meet legal obligations and to establish, exercise or defend legal claims.',
                    'The requested account details and checks are needed to use the corresponding feature. Without them, account creation, sign-in, a purchase or publication may not be possible. GitHub sign-in is optional.',
                ],
            },
            {
                title: 'Recipients and service providers',
                paragraphs: [
                    'Authorised team members access information needed for administration, moderation, support and security. A seller accesses their sales and the payment information available in their own Stripe account.',
                    'Cloudflare hosts the site, its D1 database and R2 resource archives, and provides Turnstile protection against automated abuse. Turnstile verification includes the challenge token and your IP address. GitHub provides the optional sign-in service. Stripe handles payments, seller verification and payment documents. LWS delivers account emails and processes related delivery data and message contents.',
                    'Some providers may process data outside the European Economic Area. Locations and the applicable transfer arrangements depend on the provider and service. Their published privacy information is linked below. Contact Revolis for information about the safeguards applicable to your data.',
                ],
            },
            {
                title: 'Storage periods',
                paragraphs: [
                    'By default, the sign-in cookie lasts for your browser session and the server-side session expires after at most twelve hours. If you select Remember me, the cookie and session can last for seven days. GitHub sign-in state expires after ten minutes and a sensitive-action confirmation after five minutes. Password reset links expire after thirty minutes. Email verification and email change links expire after twenty-four hours.',
                    'Pending two-step verification setup expires after ten minutes. A verification challenge and its temporary cookie expire after five minutes. The authenticator secret is kept while this protection is enabled. Recovery-code records, including used codes, are kept until codes are regenerated or two-step verification is disabled.',
                    'Temporary sign-in and security data is deleted after expiry. Email verification, email change and password reset tokens are kept for about twenty-four additional hours after expiry, without remaining usable.',
                    'Account information, purchase history, access rights and moderation or security records are kept while needed to provide the account and purchased rights, meet legal obligations, investigate incidents or handle disputes. A request to erase or restrict data is reviewed in light of those purposes and the applicable rights and obligations. Withdrawing a resource does not erase its purchase history.',
                    'The language preference stored in your browser remains until it is changed or you clear the website’s local storage. Our providers apply their own storage periods to the data they process for their services.',
                ],
            },
            {
                title: 'Cookies and local storage',
                paragraphs: [
                    'KraftInk uses a session cookie for sign-in and temporary cookies to secure GitHub sign-in and two-step verification. Your language preference is saved in local storage. These features support the service and your choices. The site does not add audience analytics or advertising trackers.',
                ],
            },
            {
                title: 'Your rights',
                paragraphs: [
                    'Depending on the applicable conditions, you can request access, correction, erasure, restriction or portability of your data. You can object to processing based on legitimate interests. Contact Revolis at the address below and describe your request. We may ask for information necessary to confirm that the request concerns your data.',
                    'You can also lodge a complaint with the French data protection authority, the CNIL. Its guidance on personal data rights is linked below.',
                ],
            },
        ],
    },
};
