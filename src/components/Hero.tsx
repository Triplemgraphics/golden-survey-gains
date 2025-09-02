import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Users, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-subtle">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-hero rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Trust indicators */}
          <div className="flex justify-center items-center gap-6 mb-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">10,000+ Members</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">100% Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Instant Payouts</span>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Earn Up to{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Ksh 300
            </span>{" "}
            Per Survey
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of Kenyans earning money by sharing their opinions. 
            Complete surveys, get paid instantly, and turn your free time into income.
          </p>

          {/* Star rating */}
          <div className="flex justify-center items-center gap-2 mb-8">
            <div className="flex text-primary">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <span className="text-muted-foreground font-medium">4.9/5 from 2,500+ reviews</span>
          </div>

          <div className="flex justify-center">
            <Button variant="hero" size="xl" className="group" asChild>
              <Link to="/auth">
                Get Started Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-16 border-t border-border">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">Ksh 150</div>
              <div className="text-muted-foreground">Average Per Survey</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">2-5 min</div>
              <div className="text-muted-foreground">Survey Duration</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">New Surveys</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;