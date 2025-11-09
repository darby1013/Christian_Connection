import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle, AlertCircle, ExternalLink, Copy, Check,
  Loader2, PlayCircle, Shield, Key, Webhook, CreditCard
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PaymentGatewaySetupWizard({ gatewayType, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [instructionContent, setInstructionContent] = useState(null);
  const [copiedText, setCopiedText] = useState("");

  const gatewayConfigs = {
    stripe: {
      name: "Stripe",
      icon: "💳",
      description: "Accept payments globally with Stripe's powerful platform",
      color: "from-purple-500 to-indigo-600",
      steps: [
        {
          title: "Create Stripe Account",
          description: "Sign up for a Stripe account to get started",
          instructions: [
            "Go to Stripe's website and create an account",
            "Complete the business verification process",
            "Provide banking information for payouts",
            "Enable your account for live transactions"
          ],
          links: [
            { label: "Sign Up for Stripe", url: "https://dashboard.stripe.com/register" },
            { label: "Stripe Dashboard", url: "https://dashboard.stripe.com" }
          ],
          videoUrl: "https://www.youtube.com/embed/cbsCFBTFDqQ"
        },
        {
          title: "Get API Keys",
          description: "Retrieve your publishable and secret keys",
          instructions: [
            "Log in to your Stripe Dashboard",
            "Navigate to Developers → API keys",
            "Copy your Publishable key (starts with pk_)",
            "Copy your Secret key (starts with sk_)",
            "Use test keys (pk_test_, sk_test_) for testing"
          ],
          links: [
            { label: "Get API Keys", url: "https://dashboard.stripe.com/apikeys" },
            { label: "API Documentation", url: "https://stripe.com/docs/keys" }
          ],
          codeExample: `// Publishable Key (Client-side)
pk_test_51ABC...XYZ

// Secret Key (Server-side - Keep Private!)
sk_test_51ABC...XYZ`
        },
        {
          title: "Configure Webhooks",
          description: "Set up webhooks for payment notifications",
          instructions: [
            "Go to Developers → Webhooks in your Stripe Dashboard",
            "Click 'Add endpoint'",
            "Enter your webhook URL: https://yoursite.com/webhooks/stripe",
            "Select events: payment_intent.succeeded, customer.subscription.updated",
            "Copy the webhook signing secret (starts with whsec_)"
          ],
          links: [
            { label: "Configure Webhooks", url: "https://dashboard.stripe.com/webhooks" },
            { label: "Webhook Events", url: "https://stripe.com/docs/webhooks" }
          ],
          codeExample: `// Webhook Endpoint
POST https://yoursite.com/webhooks/stripe

// Signing Secret
whsec_ABC123...XYZ`
        }
      ],
      testInstructions: "Use test card: 4242 4242 4242 4242, any future date, any CVC"
    },
    paypal: {
      name: "PayPal",
      icon: "💰",
      description: "Accept PayPal payments and credit cards",
      color: "from-blue-500 to-cyan-600",
      steps: [
        {
          title: "Create PayPal Business Account",
          description: "Set up your PayPal Business account",
          instructions: [
            "Visit PayPal Business and sign up",
            "Choose 'Business Account' type",
            "Complete business verification",
            "Link your bank account",
            "Enable payment receiving"
          ],
          links: [
            { label: "PayPal Business Signup", url: "https://www.paypal.com/us/business" },
            { label: "PayPal Dashboard", url: "https://www.paypal.com/businessmanage" }
          ]
        },
        {
          title: "Get API Credentials",
          description: "Generate your PayPal API credentials",
          instructions: [
            "Log in to PayPal Developer Portal",
            "Create a new app under 'My Apps & Credentials'",
            "Get your Client ID and Secret",
            "Use Sandbox credentials for testing",
            "Switch to Live credentials for production"
          ],
          links: [
            { label: "Developer Portal", url: "https://developer.paypal.com/dashboard" },
            { label: "API Documentation", url: "https://developer.paypal.com/docs/api/overview/" }
          ],
          codeExample: `// Client ID
AXVx...mnop

// Secret Key
ELK...789xyz`
        },
        {
          title: "Configure Webhooks",
          description: "Set up PayPal IPN or Webhooks",
          instructions: [
            "Go to your app settings in Developer Portal",
            "Add webhook URL: https://yoursite.com/webhooks/paypal",
            "Subscribe to events: PAYMENT.SALE.COMPLETED, BILLING.SUBSCRIPTION.UPDATED",
            "Save webhook ID for verification"
          ],
          links: [
            { label: "Webhook Setup", url: "https://developer.paypal.com/docs/api-basics/notifications/webhooks/" }
          ],
          codeExample: `// Webhook URL
POST https://yoursite.com/webhooks/paypal`
        }
      ],
      testInstructions: "Use PayPal Sandbox accounts for testing payments"
    },
    cashapp: {
      name: "Cash App",
      icon: "💵",
      description: "Accept Cash App payments directly",
      color: "from-green-500 to-emerald-600",
      steps: [
        {
          title: "Cash App Business Account",
          description: "Set up Cash App for Business",
          instructions: [
            "Download Cash App and create a personal account",
            "Upgrade to a Business account in settings",
            "Complete business verification",
            "Set up your $Cashtag (e.g., $YourBusiness)",
            "Enable payment receiving"
          ],
          links: [
            { label: "Cash App Business", url: "https://cash.app/business" },
            { label: "Help Center", url: "https://cash.app/help" }
          ]
        },
        {
          title: "API Access (If Available)",
          description: "Request Cash App API access",
          instructions: [
            "Contact Cash App Business Support",
            "Request API access for your business",
            "Wait for approval (may take several days)",
            "Receive API credentials once approved",
            "Alternatively, use manual payment verification"
          ],
          links: [
            { label: "Cash App Support", url: "https://cash.app/help" }
          ],
          codeExample: `// Manual verification method
$Cashtag: $YourBusiness
Note: Manual payment confirmation required`
        },
        {
          title: "Payment Verification",
          description: "Set up payment verification process",
          instructions: [
            "Share your $Cashtag with customers",
            "Request unique payment references",
            "Manually verify payments in Cash App",
            "Mark payments as confirmed in your system",
            "Consider using QR codes for easier payments"
          ],
          links: [
            { label: "Payment Methods", url: "https://cash.app/help/us/en-us/6482-payment-methods" }
          ]
        }
      ],
      testInstructions: "Test with small amounts (e.g., $0.01) to verify payment flow"
    },
    square: {
      name: "Square",
      icon: "◼️",
      description: "Accept payments with Square's platform",
      color: "from-gray-700 to-slate-800",
      steps: [
        {
          title: "Create Square Account",
          description: "Sign up for Square",
          instructions: [
            "Visit Square's website and create account",
            "Complete business profile",
            "Verify your business information",
            "Link bank account for payouts"
          ],
          links: [
            { label: "Square Signup", url: "https://squareup.com/signup" },
            { label: "Square Dashboard", url: "https://squareup.com/dashboard" }
          ]
        },
        {
          title: "Get Application Credentials",
          description: "Generate API credentials",
          instructions: [
            "Go to Square Developer Portal",
            "Create a new application",
            "Get Application ID and Access Token",
            "Use Sandbox for testing",
            "Switch to Production when ready"
          ],
          links: [
            { label: "Developer Portal", url: "https://developer.squareup.com/apps" },
            { label: "API Documentation", url: "https://developer.squareup.com/docs" }
          ],
          codeExample: `// Application ID
sq0idp-...

// Access Token
EAAAl...xyz`
        },
        {
          title: "Configure Webhooks",
          description: "Set up payment notifications",
          instructions: [
            "In Developer Portal, go to Webhooks",
            "Add webhook URL: https://yoursite.com/webhooks/square",
            "Select events: payment.created, payment.updated",
            "Copy signature key for verification"
          ],
          links: [
            { label: "Webhook Setup", url: "https://developer.squareup.com/docs/webhooks/overview" }
          ]
        }
      ],
      testInstructions: "Use Square Sandbox with test card: 4111 1111 1111 1111"
    }
  };

  const config = gatewayConfigs[gatewayType];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const openInstructionModal = (content) => {
    setInstructionContent(content);
    setShowInstructionModal(true);
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate API testing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const isSuccess = Math.random() > 0.3; // 70% success rate for demo
    setTestResult({
      success: isSuccess,
      message: isSuccess 
        ? `${config.name} connection successful! All credentials verified.`
        : "Connection failed. Please check your API keys and try again.",
      details: isSuccess ? [
        "✓ API keys validated",
        "✓ Webhook endpoint accessible",
        "✓ Test transaction successful"
      ] : [
        "✗ Invalid API credentials",
        "! Check your secret key",
        "! Verify webhook URL is accessible"
      ]
    });

    setIsTesting(false);
  };

  const currentStepData = config.steps[currentStep];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center text-3xl shadow-xl`}>
              {config.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white mb-1">{config.name} Setup</h2>
              <p className="text-slate-300">{config.description}</p>
            </div>
            <Badge className="bg-cyan-500 text-lg px-4 py-2">
              Step {currentStep + 1} of {config.steps.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {config.steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                index < currentStep ? 'bg-green-500 text-white' :
                index === currentStep ? 'bg-cyan-500 text-white' :
                'bg-slate-700 text-slate-400'
              }`}>
                {index < currentStep ? <CheckCircle className="w-6 h-6" /> : index + 1}
              </div>
              <p className={`text-xs mt-2 font-semibold ${
                index === currentStep ? 'text-cyan-400' : 'text-slate-500'
              }`}>
                {step.title.split(' ')[0]}
              </p>
            </div>
            {index < config.steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 transition-all ${
                index < currentStep ? 'bg-green-500' : 'bg-slate-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-black text-xl flex items-center gap-2">
            {currentStep === 0 && <Shield className="w-6 h-6 text-cyan-400" />}
            {currentStep === 1 && <Key className="w-6 h-6 text-amber-400" />}
            {currentStep === 2 && <Webhook className="w-6 h-6 text-purple-400" />}
            {currentStepData.title}
          </CardTitle>
          <p className="text-slate-400">{currentStepData.description}</p>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="bg-slate-900/50 border border-slate-700">
              <TabsTrigger value="instructions" className="data-[state=active]:bg-cyan-500">
                Instructions
              </TabsTrigger>
              {currentStepData.codeExample && (
                <TabsTrigger value="code" className="data-[state=active]:bg-cyan-500">
                  Code Example
                </TabsTrigger>
              )}
              {currentStepData.videoUrl && (
                <TabsTrigger value="video" className="data-[state=active]:bg-cyan-500">
                  Video Tutorial
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="instructions" className="space-y-4 mt-4">
              <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                {currentStepData.instructions.map((instruction, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-slate-300 pt-0.5">{instruction}</p>
                  </div>
                ))}
              </div>

              {currentStepData.links && (
                <div className="space-y-2">
                  <p className="text-white font-bold mb-3">Quick Links:</p>
                  {currentStepData.links.map((link, idx) => (
                    <Button
                      key={idx}
                      onClick={() => openInstructionModal(link)}
                      className="w-full justify-between bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              )}
            </TabsContent>

            {currentStepData.codeExample && (
              <TabsContent value="code" className="mt-4">
                <div className="bg-slate-900 rounded-lg p-4 relative">
                  <Button
                    onClick={() => copyToClipboard(currentStepData.codeExample)}
                    className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600"
                    size="sm"
                  >
                    {copiedText === currentStepData.codeExample ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <pre className="text-cyan-400 text-sm font-mono overflow-x-auto">
                    {currentStepData.codeExample}
                  </pre>
                </div>
              </TabsContent>
            )}

            {currentStepData.videoUrl && (
              <TabsContent value="video" className="mt-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    width="100%"
                    height="100%"
                    src={currentStepData.videoUrl}
                    title="Setup Tutorial"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Test Connection (Final Step) */}
      {currentStep === config.steps.length - 1 && (
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
          <CardHeader className="border-b border-orange-500/20">
            <CardTitle className="text-white font-black flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-orange-400" />
              Test Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-cyan-400 font-bold mb-2">Test Instructions:</p>
              <p className="text-slate-300 text-sm">{config.testInstructions}</p>
            </div>

            <Button
              onClick={testConnection}
              disabled={isTesting}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold text-lg py-6"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Test Gateway Connection
                </>
              )}
            </Button>

            {testResult && (
              <Card className={`${testResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-bold mb-2 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {testResult.message}
                      </p>
                      <ul className="space-y-1">
                        {testResult.details.map((detail, idx) => (
                          <li key={idx} className="text-slate-300 text-sm">{detail}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          variant="outline"
          className="border-slate-700"
        >
          Previous
        </Button>

        {currentStep < config.steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            Next Step
          </Button>
        ) : (
          <Button
            onClick={onComplete}
            disabled={!testResult?.success}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Complete Setup
          </Button>
        )}
      </div>

      {/* Instruction Modal */}
      <Dialog open={showInstructionModal} onOpenChange={setShowInstructionModal}>
        <DialogContent className="bg-[#1a1f3a] border-slate-700 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-cyan-400" />
              {instructionContent?.label}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Follow the instructions on this page to complete the setup
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-bold">Direct Link:</p>
                <Button
                  onClick={() => copyToClipboard(instructionContent?.url)}
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  {copiedText === instructionContent?.url ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-slate-800 rounded p-3 font-mono text-cyan-400 text-sm break-all">
                {instructionContent?.url}
              </div>
            </div>

            <Button
              onClick={() => window.open(instructionContent?.url, '_blank')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-bold text-lg py-6"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Open in New Tab
            </Button>

            <div className="border-t border-slate-700 pt-4">
              <p className="text-slate-400 text-sm text-center">
                After completing the steps, return here to continue the setup process
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}