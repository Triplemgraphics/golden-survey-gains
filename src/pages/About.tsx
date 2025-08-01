import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Users, Target, Globe, TrendingUp } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
                About Survey Africa
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Bridging the gap between African businesses and global investors through data-driven insights
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-foreground">
                    Our Mission
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    Survey Africa is a UK-based research company dedicated to providing comprehensive market intelligence on African businesses and economies. We conduct detailed surveys and market research across the African continent to help foreign investors make informed decisions about investment opportunities in this rapidly growing market.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Founded with the vision of democratizing access to African market data, we bridge the information gap that has traditionally hindered foreign investment in Africa. Our platform connects local African businesses and consumers with international investors seeking authentic, real-time insights into market trends, consumer behavior, and business opportunities across diverse African economies.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <Target className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-3">Targeted Research</h3>
                    <p className="text-muted-foreground">
                      Focused surveys on specific sectors and markets across Africa
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-6">
                    <Globe className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-3">Global Reach</h3>
                    <p className="text-muted-foreground">
                      Connecting international investors with African opportunities
                    </p>
                  </div>
                </div>
              </div>

              {/* What We Do */}
              <div className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-center text-foreground">
                  What We Do
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Market Surveys</h3>
                    <p className="text-muted-foreground">
                      Comprehensive surveys of African businesses, consumers, and market conditions
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Investment Intelligence</h3>
                    <p className="text-muted-foreground">
                      Data-driven insights to guide foreign investment decisions across Africa
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Local Partnerships</h3>
                    <p className="text-muted-foreground">
                      Building bridges between local African businesses and global investors
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="text-center bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-12">
                <h2 className="text-3xl font-bold mb-4 text-foreground">
                  Join Our Research Community
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Whether you're an African business owner, consumer, or international investor, 
                  become part of our community and help shape the future of African investment.
                </p>
                <Button size="lg" className="font-semibold" asChild>
                  <a href="/auth">Get Started Today</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;