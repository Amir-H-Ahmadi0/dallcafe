import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { MenuSection } from '@/components/MenuSection';
import { AboutSection } from '@/components/AboutSection';
import { LocationAndContact } from '@/components/LocationAndContact';
import { Footer } from '@/components/Footer';
import { ScrollToTop } from '@/components/ScrollToTop';
import { MobileHeaderWrapper } from '@/components/MobileHeaderWrapper';
import { BottomNavWrapper } from '@/components/BottomNavWrapper';
import { getStoredMenuData } from '@/lib/menu-storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function HomePage() {
    const { items, categories, cafeInfo } = await getStoredMenuData(true);

    return (
        <>
            {/* Main Page Layout Container (with bottom padding for mobile quick nav) */}
            <div className={`min-h-screen flex flex-col transition-colors duration-300 pb-20 md:pb-6 bg-[#051A15] text-[#F6F4EE] selection:bg-[#DFBA87] selection:text-[#1E170F]`}>

                {/* Top Header Navbar (Desktop - Fixed at Top) */}
                <div className="hidden md:block">
                    <Header />
                </div>

                {/* Mobile Header (Mobile View - Fixed at Top) */}
                <div className="block md:hidden">
                    <MobileHeaderWrapper cafeInfo={cafeInfo} />
                </div>

                {/* Top Spacer to account for Fixed Headers (Mobile ~112px, Desktop ~72px) */}
                <div className="h-[20px] md:h-[72px] shrink-0" aria-hidden="true" />

                {/* Main Content - Everything is sequentially present on the main page */}
                <main className="flex-1 space-y-4">
                    {/* Hero Banner (Compact on mobile, full on desktop) */}
                    <Hero cafeInfo={cafeInfo} />

                    {/* Digital menu is read from the project's source data. */}
                    <div id="menu">
                        <MenuSection
                            categories={categories}
                            items={items}
                        />
                    </div>

                    {/* Cafe Information: Philosophy & Story */}
                    <div id="about">
                        <AboutSection cafeInfo={cafeInfo} />
                    </div>

                    {/* Cafe Location, Working Hours & Direct Contact */}
                    <div id="routing">
                        <LocationAndContact cafeInfo={cafeInfo} />
                    </div>
                </main>

                {/* Footer (Rendered on customer view) */}
                <Footer cafeInfo={cafeInfo} />

                {/* Floating Scroll To Top Button */}
                <ScrollToTop />
            </div>

            <BottomNavWrapper />
        </>
    );
}
