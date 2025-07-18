import { Button } from "@/components/ui/button";
import { Menu, X, Star, Crown } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "#home" },
    { name: "Features", href: "#features" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "FAQ", href: "#faq" },
    { name: "Contact", href: "#contact" }
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
                BunnySurveys
              </div>
              <div className="text-xs text-muted-foreground -mt-1">
                Earn. Share. Prosper.
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors font-medium relative group"
              >
                {item.name}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="font-medium">
              Sign In
            </Button>
            <Button variant="default" className="font-medium">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border/50 shadow-elegant">
            <nav className="container mx-auto px-6 py-6 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block text-foreground hover:text-primary transition-colors font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 border-t border-border space-y-3">
                <Button variant="ghost" className="w-full justify-start">
                  Sign In
                </Button>
                <Button variant="default" className="w-full">
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Trust Badge */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center py-2 text-sm">
            <div className="flex items-center gap-2 text-primary">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-medium">4.9/5 rated • 10,000+ members earning daily • Instant payouts</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;