import Link from "next/link";
import { ShoppingBag, Instagram, Twitter, Facebook, MapPin, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-amber-50 to-white dark:from-black dark:to-neutral-900 pt-16 pb-8 border-t-0 w-full">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap justify-between gap-8 mb-12">
          
          {/* --- Brand Section --- */}
          <div className="flex-1 min-w-[250px] max-w-[300px]">
            <Link href="/" className="flex items-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  <span className="text-amber-600">qwik</span><span className="text-black">Bite</span>
                </span>
              </div>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Skip the line. Eat on time.<br />
              Pre-order your favorite meals from your college canteen.
            </p>
            <div className="flex space-x-4">
              <Link href="#" aria-label="Instagram" className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center hover:bg-orange-500 dark:hover:bg-orange-500 transition-colors">
                <Instagram className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              </Link>
              <Link href="#" aria-label="Twitter" className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center hover:bg-orange-500 dark:hover:bg-orange-500 transition-colors">
                <Twitter className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              </Link>
              <Link href="#" aria-label="Facebook" className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center hover:bg-orange-500 dark:hover:bg-orange-500 transition-colors">
                <Facebook className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              </Link>
            </div>
          </div>

          {/* --- Quick Links --- */}
          <div className="flex-1 min-w-[150px]">
            <h5 className="font-semibold mb-4 text-black">Quick Links</h5>
            <ul className="space-y-2">
              <li><Link href="/customer/menu" className="text-gray-600 dark:text-gray-400 text-sm hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Menu</Link></li>
              <li><Link href="/customer/orders" className="text-gray-600 dark:text-gray-400 text-sm hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Orders</Link></li>
              <li><Link href="/customer/favourites" className="text-gray-600 dark:text-gray-400 text-sm hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Favourites</Link></li>
              <li><Link href="/customer/feedback" className="text-gray-600 dark:text-gray-400 text-sm hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Feedback</Link></li>
            </ul>
          </div>

          {/* --- Help & Support --- */}
          <div className="flex-1 min-w-[150px]">
            <h5 className="font-semibold mb-4 text-black">Help & Support</h5>
            <ul className="space-y-2">
              <li><Link href="/customer/help" className="text-gray-600 dark:text-gray-400 text-sm hover:text-orange-600 dark:hover:text-orange-400 transition-colors">FAQ</Link></li>
              <li><Link href="/customer/help" className="text-gray-600 dark:text-gray-400 text-sm hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/customer/help" className="text-gray-600 dark:text-gray-400 text-sm hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/customer/help" className="text-gray-600 dark:text-gray-400 text-sm hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* --- Contact Section (Updated) --- */}
          <div className="flex-1 min-w-[250px]">
            <h5 className="font-semibold mb-4 text-black">Contact</h5>
            <address className="not-italic space-y-2">
              <p className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                123 College Avenue, Campus, CA 94158
              </p>
              <p className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <Mail className="h-4 w-4 mr-2 text-orange-600" />
                <a href="mailto:info@qwikBite.com" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  info@qwikBite.com
                </a>
              </p>
              <p className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <Phone className="h-4 w-4 mr-2 text-orange-600" />
                <a href="tel:+11234567890" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  +1 (123) 456-7890
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* --- Bottom line --- */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
            &copy; {new Date().getFullYear()} qwikBite. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
