export default function DeleteAccountPage() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-16">
            <h1 className="mb-6 text-3xl font-bold">
                Delete your BIRAMY account
            </h1>

            <div className="space-y-6 text-base leading-7">
                <p>
                    You can request deletion of your BIRAMY account and associated
                    personal data at any time.
                </p>

                <section>
                    <h2 className="mb-2 text-xl font-semibold">
                        How to request account deletion
                    </h2>

                    <p>
                        Email{" "}
                        <a
                            href="mailto:support@biramy.com?subject=Delete%20my%20BIRAMY%20account"
                            className="underline"
                        >
                            support@biramy.com
                        </a>{" "}
                        from the email address associated with your BIRAMY account and use
                        the subject <strong>“Delete my BIRAMY account.”</strong>
                    </p>
                </section>

                <section>
                    <h2 className="mb-2 text-xl font-semibold">
                        What will be deleted
                    </h2>

                    <p>
                        After verifying your request, BIRAMY will delete your account and
                        associated personal data, including account information, saved
                        closet items, saved looks, and other account-linked content.
                    </p>
                </section>

                <section>
                    <h2 className="mb-2 text-xl font-semibold">
                        Information we may retain
                    </h2>

                    <p>
                        Some information may be retained where necessary for legal,
                        security, fraud-prevention, backup, or regulatory purposes. Any
                        retained information will be handled in accordance with our Privacy
                        Policy.
                    </p>
                </section>

                <p>
                    For more information, see our{" "}
                    <a href="/privacy" className="underline">
                        Privacy Policy
                    </a>
                    .
                </p>
            </div>
        </main>
    );
}