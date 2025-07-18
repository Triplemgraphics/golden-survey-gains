import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Njoki",
      location: "Nairobi",
      rating: 5,
      text: "I've earned over Ksh 15,000 in just 3 months! The surveys are interesting and payouts are instant. Perfect side income.",
      earnings: "Ksh 15,000+ earned",
      avatar: "SN"
    },
    {
      name: "David Kimani",
      location: "Mombasa", 
      rating: 5,
      text: "BunnySurveys changed my life. I can now pay for my daily expenses just by sharing my opinions during lunch breaks.",
      earnings: "Ksh 12,500+ earned",
      avatar: "DK"
    },
    {
      name: "Grace Wanjiru",
      location: "Kisumu",
      rating: 5,
      text: "As a student, this is perfect! I earn money for books and transport without affecting my studies. Highly recommend!",
      earnings: "Ksh 8,200+ earned",
      avatar: "GW"
    },
    {
      name: "Michael Ochieng",
      location: "Eldoret",
      rating: 5,
      text: "The mobile app is so convenient. I complete surveys while commuting and the money adds up quickly. Great platform!",
      earnings: "Ksh 18,700+ earned",
      avatar: "MO"
    },
    {
      name: "Fatuma Hassan",
      location: "Nakuru",
      rating: 5,
      text: "I was skeptical at first, but after receiving my first payment in 10 minutes, I'm convinced. This is legitimate!",
      earnings: "Ksh 6,800+ earned",
      avatar: "FH"
    },
    {
      name: "Peter Mwangi",
      location: "Thika",
      rating: 5,
      text: "The surveys are relevant to our local market. I feel my opinions actually matter and I get paid for them. Win-win!",
      earnings: "Ksh 22,100+ earned",
      avatar: "PM"
    }
  ];

  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            What Our{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Members Say
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied members who are already earning with BunnySurveys. 
            Real people, real earnings, real reviews.
          </p>
        </div>

        {/* Featured testimonial */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="bg-gradient-primary text-primary-foreground shadow-glow border-0">
            <CardContent className="p-8 text-center">
              <Quote className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <blockquote className="text-2xl md:text-3xl font-medium mb-6 leading-relaxed">
                "I've tried many survey platforms, but BunnySurveys is by far the best. 
                The payouts are fast, surveys are relevant, and I've earned enough to start my small business!"
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center text-2xl font-bold">
                  AK
                </div>
                <div className="text-left">
                  <div className="font-semibold text-lg">Alice Koech</div>
                  <div className="opacity-90">Entrepreneur, Nairobi</div>
                  <div className="text-primary-glow font-medium">Ksh 45,000+ earned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                
                <blockquote className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.text}"
                </blockquote>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-primary font-semibold text-sm">{testimonial.earnings}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16 pt-16 border-t border-border">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">4.9/5</div>
            <div className="text-muted-foreground">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
            <div className="text-muted-foreground">Happy Members</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">50,000+</div>
            <div className="text-muted-foreground">Surveys Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">KSh 2M+</div>
            <div className="text-muted-foreground">Total Paid Out</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;