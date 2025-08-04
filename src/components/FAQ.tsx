import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      question: "How do I sign up for Survey Africa?",
      answer: "Signing up is completely free and takes less than 2 minutes. Simply click 'Get Started', provide your basic information (name, email, phone), verify your account, and you're ready to start earning! No hidden fees or registration costs."
    },
    {
      question: "Is Survey Africa really free to join?",
      answer: "Yes, absolutely! Survey Africa is 100% free to join and use. We never charge any membership fees, registration costs, or hidden charges. You only earn money - never spend it with us."
    },
    {
      question: "How are surveys matched to me?",
      answer: "Our smart matching system considers your age, location, interests, and demographic profile to send you relevant surveys. This ensures you qualify for more surveys and earn more money. The more complete your profile, the better the matches!"
    },
    {
      question: "How much money can I earn?",
      answer: "Earnings vary based on survey length and complexity. Short surveys (2-3 minutes) typically pay Ksh 50-150, while longer surveys (10-15 minutes) can pay up to Ksh 300. Most active members earn Ksh 5,000-35,000 per month."
    },
    {
      question: "How and when do I get paid?",
      answer: "You can request payment once you reach the minimum threshold of Ksh 500. Payments are processed instantly via M-Pesa, bank transfer, or mobile money. Most members receive their money within 10 minutes of requesting withdrawal."
    },
    {
      question: "What types of surveys will I receive?",
      answer: "You'll receive surveys about products, services, brands, and topics relevant to the Kenyan market. Topics include consumer goods, technology, entertainment, food & beverage, banking, and more. All surveys are from legitimate companies conducting market research."
    },
    {
      question: "Can I use Survey Africa on my mobile phone?",
      answer: "Yes! Our platform is fully optimized for mobile devices. You can complete surveys on your smartphone, tablet, or computer. Many members prefer mobile because they can earn on-the-go during commutes, breaks, or free time."
    },
    {
      question: "Is my personal information safe?",
      answer: "Your privacy and security are our top priorities. We use bank-level encryption to protect your data and never share your personal information with third parties. All survey responses are anonymous and used only for legitimate market research."
    },
    {
      question: "What if I don't qualify for a survey?",
      answer: "Not qualifying is normal - it ensures you only get relevant surveys. If you don't qualify, you'll often receive a small compensation (Ksh 10-20) for your time. Don't worry, more surveys that match your profile will come soon!"
    },
    {
      question: "Can I refer friends and earn more?",
      answer: "Yes! Our referral program gives you Ksh 200 for every friend who joins and completes their first survey. Plus, you earn 10% bonus on their earnings for their first month. There's no limit to how many friends you can refer!"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers! Here are the most common questions 
            our members ask about earning with Survey Africa.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 hover:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Still have questions CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-subtle border border-border/50 rounded-2xl p-8 max-w-2xl mx-auto">
            <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Still Have Questions?</h3>
            <p className="text-muted-foreground mb-6">
              Our friendly support team is here to help! Get personalized answers 
              to any questions about earning with Survey Africa.
            </p>
            <div className="flex justify-center">
              <Button variant="default" size="lg">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;