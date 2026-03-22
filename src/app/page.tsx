import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '../components/footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { LineChart, BarChart3, ArrowRight, Globe, Zap } from 'lucide-react';
// import TickerTape from '../components/TickerTape';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* <TickerTape /> */}
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted z-0"></div>
        <div className="absolute inset-0 opacity-20 z-0">
          <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>
        
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your <span className="text-primary">Quantitative</span> Edge in the Markets
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10">
              Advanced financial models, backtests, and market insights to help you make data-driven investment decisions.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">Get Started</Button>
              </Link>
              <Link href="/models">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">Explore Models</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Tools for Quantitative Analysis
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Leverage our suite of tools to analyze markets, backtest strategies, and stay ahead of trends.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Backtested Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Explore trading strategies with historical performance data across stocks, crypto, and forex markets.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/backtests">
                  <Button variant="link" className="gap-1">
                    View Backtests <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Feature 2 */}
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <LineChart className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle>Market Models</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Access predictive models and indicators that help identify market trends and potential opportunities.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/models">
                  <Button variant="link" className="gap-1">
                    Explore Models <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Feature 3 */}
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-accent" />
                </div>
                <CardTitle>Global Markets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Track and analyze markets worldwide with real-time data, custom alerts, and comprehensive dashboards.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/models">
                  <Button variant="link" className="gap-1">
                    View Markets <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to gain your quantitative edge?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of traders and investors who use Quant (h)Edge to make data-driven decisions in the financial markets.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">Get Started Now</Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">View Pricing</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}