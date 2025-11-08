import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Heart, Send, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RealTimeTipJar({ stream, user }) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const queryClient = useQueryClient();

  const quickAmounts = [5, 10, 25, 50, 100];

  const tipMutation = useMutation({
    mutationFn: (tipData) => base44.entities.StreamTip.create(tipData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamTips', stream.id] });
      setAmount("");
      setMessage("");
      alert("Thank you for your generous tip! 🙏");
    },
  });

  const handleTip = () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid tip amount");
      return;
    }

    tipMutation.mutate({
      stream_id: stream.id,
      tipper_id: user.id,
      tipper_name: isAnonymous ? "Anonymous" : user.full_name,
      amount: parseFloat(amount),
      message: message,
      is_anonymous: isAnonymous,
      show_on_stream: showAlert,
      payment_status: "completed",
      currency: "USD"
    });
  };

  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
      <CardHeader className="border-b border-amber-500/20">
        <CardTitle className="text-white font-black text-lg flex items-center gap-2">
          <Heart className="w-5 h-5 text-amber-400 fill-amber-400" />
          Support the Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <Label className="text-white font-bold mb-2 block">Quick Tip Amount</Label>
          <div className="grid grid-cols-5 gap-2">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                variant={amount === amt.toString() ? "default" : "outline"}
                className={amount === amt.toString() 
                  ? "bg-amber-500 hover:bg-amber-600 text-white font-bold border-0" 
                  : "border-amber-500/30 text-amber-300 hover:bg-amber-500/20"}
                onClick={() => setAmount(amt.toString())}
              >
                ${amt}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-white font-bold mb-2 block">Custom Amount ($)</Label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            step="1"
            className="bg-slate-900/50 border-amber-500/30 text-white"
          />
        </div>

        <div>
          <Label className="text-white font-bold mb-2 block">Message (Optional)</Label>
          <Textarea
            placeholder="Leave an encouraging message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-slate-900/50 border-amber-500/30 text-white h-20"
            maxLength={200}
          />
          <p className="text-xs text-slate-400 mt-1">{message.length}/200</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
            <Label className="text-white text-sm font-semibold">Send anonymously</Label>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
            <Label className="text-white text-sm font-semibold">Show alert on stream</Label>
            <Switch checked={showAlert} onCheckedChange={setShowAlert} />
          </div>
        </div>

        <Button
          onClick={handleTip}
          disabled={!amount || tipMutation.isPending}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold h-12 text-lg"
        >
          {tipMutation.isPending ? (
            "Processing..."
          ) : (
            <>
              <Heart className="w-5 h-5 mr-2 fill-white" />
              Send Tip ${amount || '0'}
            </>
          )}
        </Button>

        <div className="pt-4 border-t border-amber-500/20">
          <p className="text-xs text-slate-400 text-center">
            Your support helps create amazing content for the community 💛
          </p>
        </div>
      </CardContent>
    </Card>
  );
}