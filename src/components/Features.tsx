import { Card, CardContent } from "@/components/ui/card";
import { 
  Smartphone, 
  DollarSign, 
  Target, 
  Shield, 
  Clock, 
  Users,
  TrendingUp,
  Gift
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: DollarSign,
      title: "Fast Payouts",
      description: "Get paid instantly via M-Pesa, bank transfer, or mobile money. No waiting periods.",
      color: "text-primary"
    },
    {
      icon: Smartphone,
      title: "Mobile-Friendly",
      description: "Complete surveys anywhere, anytime. Our platform works perfectly on all devices.",
      color: "text-primary"
    },
    {
      icon: Target,
      title: "Personalized Surveys",
      description: "Receive surveys that match your profile and interests for better earning potential.",
      color: "text-primary"
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Your data is protected with bank-level security. We never share personal information.",
      color: "text-primary"
    },
    {
      icon: Clock,
      title: "Quick & Easy",
      description: "Most surveys take 2-5 minutes. Simple questions, maximum earnings in minimum time.",
      color: "text-primary"
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Join our active community of earners. Get tips, support, and maximize your income.",
      color: "text-primary"
    },
    {
      icon: TrendingUp,
      title: "Growing Earnings",
      description: "The more surveys you complete, the more opportunities unlock. Build your earning profile.",
      color: "text-primary"
    },
    {
      icon: Gift,
      title: "Bonus Rewards",
      description: "Earn extra through referrals, daily bonuses, and special promotional campaigns.",
      color: "text-primary"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Why Choose{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Survey Africa
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We've built the most user-friendly survey platform in Kenya. 
            Here's what makes us different from the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-border/50 hover:border-primary/30"
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all duration-300">
                  <feature.icon className={`w-8 h-8 ${feature.color} group-hover:text-primary-foreground`} />
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-full mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">Trusted by 10,000+ Kenyans</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;