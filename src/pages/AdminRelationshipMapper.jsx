import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch, Database, ArrowRight, Link2, Key
} from "lucide-react";

export default function AdminRelationshipMapper() {
  const relationships = [
    {
      from: "Order",
      to: "User",
      type: "MANY_TO_ONE",
      foreignKey: "customer_id",
      description: "Each order belongs to one customer"
    },
    {
      from: "ProductVariant",
      to: "Product",
      type: "MANY_TO_ONE",
      foreignKey: "product_id",
      description: "Variants belong to parent products"
    },
    {
      from: "ProductReview",
      to: "Product",
      type: "MANY_TO_ONE",
      foreignKey: "product_id",
      description: "Reviews reference products"
    },
    {
      from: "Inventory",
      to: "Product",
      type: "ONE_TO_ONE",
      foreignKey: "product_id",
      description: "Each product has inventory tracking"
    },
    {
      from: "CustomerLoyalty",
      to: "User",
      type: "ONE_TO_ONE",
      foreignKey: "user_id",
      description: "One loyalty record per customer"
    },
    {
      from: "ShoppingCart",
      to: "User",
      type: "ONE_TO_MANY",
      foreignKey: "user_id",
      description: "Users can have multiple carts over time"
    }
  ];

  const getTypeColor = (type) => {
    switch(type) {
      case 'ONE_TO_ONE': return 'bg-green-500';
      case 'ONE_TO_MANY': return 'bg-blue-500';
      case 'MANY_TO_ONE': return 'bg-purple-500';
      case 'MANY_TO_MANY': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Entity Relationship Mapper</h2>
        <p className="text-slate-400 font-semibold">Visual database relationships and foreign keys</p>
      </div>

      {/* ERD Visualization */}
      <Card className="bg-[#1a1f3a] border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white font-bold flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-cyan-400" />
            Entity Relationship Diagram
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-4">
            {relationships.map((rel, idx) => (
              <div key={idx} className="p-6 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-4 mb-3">
                  <Badge className="bg-purple-500 px-4 py-2 text-base font-bold">
                    <Database className="w-4 h-4 mr-2" />
                    {rel.from}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-6 h-6 text-cyan-400" />
                    <Badge className={`${getTypeColor(rel.type)} text-sm px-3`}>
                      {rel.type}
                    </Badge>
                    <ArrowRight className="w-6 h-6 text-cyan-400" />
                  </div>
                  <Badge className="bg-cyan-500 px-4 py-2 text-base font-bold">
                    <Database className="w-4 h-4 mr-2" />
                    {rel.to}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <code className="text-amber-300 font-mono text-sm">
                    {rel.from}.{rel.foreignKey} → {rel.to}.id
                  </code>
                </div>
                <p className="text-slate-400 text-sm">{rel.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}