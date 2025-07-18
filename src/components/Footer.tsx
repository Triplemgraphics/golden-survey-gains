import { Button } from "@/components/ui/button";
import { Crown, Mail, Phone, MapPin, Facebook, Twitter, Instagram, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <div className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
                  BunnySurveys
                </div>
                <div className="text-xs text-background/70 -mt-1">
                  Earn. Share. Prosper.
                </div>
              </div>
            </div>
            <p className="text-background/80 leading-relaxed">
              Kenya's #1 survey platform helping thousands earn money by sharing their opinions. 
              Join our community and start earning today!
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="icon" className="bg-background/10 border-background/20 hover:bg-primary hover:border-primary">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="bg-background/10 border-background/20 hover:bg-primary hover:border-primary">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="bg-background/10 border-background/20 hover:bg-primary hover:border-primary">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="bg-background/10 border-background/20 hover:bg-primary hover:border-primary">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-primary">Quick Links</h3>
            <ul className="space-y-3">
              <li><a href="#home" className="text-background/80 hover:text-primary transition-colors">Home</a></li>
              <li><a href="#features" className="text-background/80 hover:text-primary transition-colors">How It Works</a></li>
              <li><a href="#testimonials" className="text-background/80 hover:text-primary transition-colors">Success Stories</a></li>
              <li><a href="#faq" className="text-background/80 hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#contact" className="text-background/80 hover:text-primary transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">Member Dashboard</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-primary">Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">Getting Started</a></li>
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">Payment Issues</a></li>
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">Account Settings</a></li>
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">Community Forum</a></li>
              <li><a href="#" className="text-background/80 hover:text-primary transition-colors">Report a Problem</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-primary">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-background/80">support@bunnysurveys.co.ke</div>
                  <div className="text-sm text-background/60">24/7 Support</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-background/80">+254 700 123 456</div>
                  <div className="text-sm text-background/60">Mon-Fri 8AM-6PM</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-background/80">Westlands, Nairobi</div>
                  <div className="text-sm text-background/60">Kenya</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="border-t border-background/20 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">10,000+</div>
              <div className="text-sm text-background/60">Active Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">KSh 2M+</div>
              <div className="text-sm text-background/60">Total Paid</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">50,000+</div>
              <div className="text-sm text-background/60">Surveys Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">4.9/5</div>
              <div className="text-sm text-background/60">Member Rating</div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-background/20 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-background/60 text-sm">
              © 2024 BunnySurveys. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-background/60 hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-background/60 hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="text-background/60 hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;