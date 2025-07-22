import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Facebook,
  Twitter,
  Instagram,
  MessageCircle
} from "lucide-react";

const Contact = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Get In{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Touch
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about earning with Survey Africa? Need support with your account? 
            We're here to help you maximize your earning potential!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Send Us a Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Enter your first name"
                    className="focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Enter your last name"
                    className="focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your.email@example.com"
                  className="focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="What's this about?"
                  className="focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Tell us how we can help you..."
                  rows={5}
                  className="focus:ring-primary focus:border-primary resize-none"
                />
              </div>
              
              <Button 
                variant="default" 
                size="lg" 
                className="w-full"
              >
                Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Cards */}
            <div className="grid gap-6">
              <Card className="group hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Mail className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                    </div>
            <div>
              <h3 className="font-semibold mb-1">Email Support</h3>
              <p className="text-muted-foreground">triplemgraphics092@gmail.com</p>
              <p className="text-sm text-muted-foreground">Response within 2 hours</p>
            </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Phone className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                    </div>
            <div>
              <h3 className="font-semibold mb-1">Phone Support</h3>
              <p className="text-muted-foreground">+254754868688</p>
              <p className="text-sm text-muted-foreground">Mon-Fri 8AM-6PM EAT</p>
            </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all duration-300">
                      <MessageCircle className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Live Chat</h3>
                      <p className="text-muted-foreground">Available 24/7</p>
                      <p className="text-sm text-muted-foreground">Instant support</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all duration-300">
                      <MapPin className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Office Location</h3>
                      <p className="text-muted-foreground">Westlands, Nairobi</p>
                      <p className="text-sm text-muted-foreground">Kenya</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Social Media */}
            <Card className="bg-gradient-primary text-primary-foreground">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Follow Us</h3>
                <p className="mb-6 opacity-90">
                  Stay updated with the latest surveys, earning tips, and platform updates!
                </p>
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="bg-primary-foreground/20 border-primary-foreground/30 hover:bg-primary-foreground/30"
                  >
                    <Facebook className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="bg-primary-foreground/20 border-primary-foreground/30 hover:bg-primary-foreground/30"
                  >
                    <Twitter className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="bg-primary-foreground/20 border-primary-foreground/30 hover:bg-primary-foreground/30"
                  >
                    <Instagram className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="bg-primary-foreground/20 border-primary-foreground/30 hover:bg-primary-foreground/30"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-semibold">Business Hours</h3>
                </div>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                  <div className="text-sm text-primary font-medium mt-3">
                    * Live chat available 24/7
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;