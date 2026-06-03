import Link from "next/link";

export const metadata = {
    title: "Disclaimer | BIRAMY Galaxy",
    description:
        "Disclaimer for BIRAMY Galaxy augmented reality shopping and styling features.",
};

export default function DisclaimerPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <section className="mx-auto max-w-4xl px-6 py-16">
                <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
                    ← Back to BIRAMY Galaxy
                </Link>

                <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                        BIRAMY Galaxy
                    </p>

                    <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
                        Disclaimer
                    </h1>

                    <p className="mt-4 text-sm text-slate-300">
                        Last updated: June 3, 2026
                    </p>

                    <div className="mt-8 space-y-8 text-slate-200 leading-7">
                        <section>
                            <h2 className="text-xl font-semibold text-white">
                                Experimental AR Shopping Experience
                            </h2>
                            <p className="mt-3">
                                BIRAMY Galaxy is an experimental augmented reality shopping and
                                styling experience designed to help users explore fashion items,
                                accessories, looks, and creative outfit possibilities in a fun
                                and interactive way.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white">
                                Virtual Try-On Previews
                            </h2>
                            <p className="mt-3">
                                Virtual try-on features are provided for visual guidance,
                                exploration, creativity, and entertainment only. AR previews may
                                not perfectly represent real-world size, fit, colour, texture,
                                lighting, placement, movement, comfort, or how an item will
                                appear in person.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white">
                                Product Information
                            </h2>
                            <p className="mt-3">
                                Product information, including prices, availability, sizing,
                                colours, materials, images, retailer information, and delivery
                                or return details, may change. Users should always confirm final
                                product information directly with the retailer before making a
                                purchase.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white">
                                Purchases and Retailer Responsibility
                            </h2>
                            <p className="mt-3">
                                Any purchase made through BIRAMY Galaxy, through links displayed
                                on BIRAMY Galaxy, or after using BIRAMY Galaxy is a transaction
                                between the user and the relevant retailer, seller, brand, or
                                third-party provider. BIRAMY Galaxy does not control retailer
                                pricing, inventory, product availability, shipping, delivery,
                                returns, refunds, warranties, customer service, product quality,
                                or fulfilment. Users should review the retailer&apos;s own terms,
                                policies, and product information before making a purchase.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white">
                                Third-Party Links and Retailers
                            </h2>
                            <p className="mt-3">
                                BIRAMY Galaxy may display or link to third-party products,
                                services, websites, retailers, images, or information. We are
                                not responsible for third-party websites, product quality,
                                delivery, pricing, returns, availability, or purchasing
                                decisions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white">
                                Affiliate Links, Sponsored Content, and Advertising
                            </h2>
                            <p className="mt-3">
                                BIRAMY Galaxy may display affiliate links, sponsored placements,
                                advertising, retailer links, or promotional content. If BIRAMY
                                Galaxy receives commission, referral fees, sponsorship fees,
                                advertising revenue, free products, or other compensation in
                                connection with products or links shown on the platform, this
                                may influence how products are displayed or promoted.
                            </p>
                            <p className="mt-3">
                                Where required, sponsored, affiliate, or promotional content
                                will be identified so users can understand when a commercial
                                relationship may exist.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white">
                                Experimental Platform and Feature Availability
                            </h2>
                            <p className="mt-3">
                                BIRAMY Galaxy is an experimental and developing platform. The
                                website, AR features, product data, saved looks, closet
                                features, previews, recommendations, links, and other services
                                may contain errors, interruptions, delays, inaccurate previews,
                                missing product information, unavailable features, or technical
                                issues.
                            </p>
                            <p className="mt-3">
                                We may update, modify, suspend, remove, or discontinue features
                                at any time as the platform develops.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white">
                                Camera-Based Features
                            </h2>
                            <p className="mt-3">
                                Camera-based features require user permission. Camera access is
                                used to support the AR try-on experience. Users should only
                                save, upload, or share captured images, saved looks, or closet
                                items when they choose to do so.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white">
                                No Professional Advice
                            </h2>
                            <p className="mt-3">
                                BIRAMY Galaxy does not provide professional fashion, medical,
                                health, safety, fitness, body-measurement, legal, or financial
                                advice. The platform is designed as a digital preview and
                                creative styling tool, not as a guarantee of exact real-world
                                results.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white">
                                User Understanding
                            </h2>
                            <p className="mt-3">
                                By using BIRAMY Galaxy, users understand that AR previews are
                                approximate and that real-world results may vary.
                            </p>
                        </section>
                    </div>
                </div>
            </section>
        </main>
    );
}