// Use subscribe.tsx for paid subscriptions.
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Music, Code, Zap, Shield, Star, Crown } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/studio?subscription=success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome to CodedSwitch Pro!",
        description: "Your subscription is now active. Enjoy unlimited features!",
      });
    }
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement className="mb-6" />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        data-testid="button-subscribe"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Crown className="mr-2 h-4 w-4" />
            Subscribe to CodedSwitch Pro
          </>
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create subscription as soon as the page loads
    apiRequest("POST", "/api/create-subscription")
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Subscription creation failed:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2">Setting up your subscription...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-red-400">Failed to initialize subscription. Please try again.</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              data-testid="button-retry"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Upgrade to <span className="text-purple-400">CodedSwitch Pro</span>
          </h1>
          <p className="text-gray-300 text-lg">
            Unlock the world's first bidirectional code-music translation platform
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Features */}
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Star className="mr-2 h-5 w-5 text-yellow-400" />
                What's Included
              </CardTitle>
              <CardDescription className="text-gray-300">
                Everything you need to bridge code and music
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Music className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Unlimited Song Analysis</h4>
                  <p className="text-gray-400 text-sm">Upload and analyze unlimited tracks with advanced AI detection of vocals, collaborators, and musical elements</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Code className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Bidirectional Translation</h4>
                  <p className="text-gray-400 text-sm">Convert code to music AND music back to functional code with 98.32% accuracy</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Zap className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">AI Memory Assistant</h4>
                  <p className="text-gray-400 text-sm">Conversational AI that remembers your projects and provides contextual recommendations</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium">Security Scanner</h4>
                  <p className="text-gray-400 text-sm">Professional vulnerability detection using our advanced AI technology</p>
                </div>
              </div>
              <div className="bg-purple-900/30 p-3 rounded-lg">
                <p className="text-purple-200 font-medium text-center">
                  💫 Plus: Export capabilities, commercial licensing, priority processing, and more!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white text-center">
                <Crown className="inline mr-2 h-5 w-5 text-yellow-400" />
                Subscribe Now
              </CardTitle>
              <CardDescription className="text-center">
                <span className="text-3xl font-bold text-white">$19.99</span>
                <span className="text-gray-400">/month</span>
                <br />
                <span className="text-sm text-green-400">Cancel anytime • No setup fees</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};