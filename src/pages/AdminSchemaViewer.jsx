
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Database, Search, Download, Eye, Code, GitBranch,
  Key, Link2, Table, FileCode, Copy, CheckCircle
} from "lucide-react";

export default function AdminSchemaViewer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState(null);

  const entitySchemas = [
    {
      name: "Product",
      type: "Commerce",
      fields: [
        { name: "id", type: "VARCHAR(255)", key: "PRIMARY", nullable: false },
        { name: "name", type: "VARCHAR(500)", nullable: false },
        { name: "description", type: "TEXT", nullable: true },
        { name: "price", type: "DECIMAL(10,2)", nullable: false },
        { name: "category", type: "VARCHAR(100)", nullable: true, indexed: true },
        { name: "stock_quantity", type: "INT", default: 0 },
        { name: "images", type: "JSON", nullable: true },
        { name: "rating", type: "DECIMAL(3,2)", default: 0 },
        { name: "created_date", type: "TIMESTAMP", default: "CURRENT_TIMESTAMP" },
        { name: "updated_date", type: "TIMESTAMP", default: "CURRENT_TIMESTAMP ON UPDATE" }
      ],
      indexes: [
        "idx_category (category)",
        "idx_price (price)",
        "idx_featured (is_featured, created_date DESC)",
        "idx_bestseller (is_bestseller, total_sales DESC)"
      ],
      relationships: [
        { entity: "ProductVariant", type: "ONE_TO_MANY", key: "product_id" },
        { entity: "ProductReview", type: "ONE_TO_MANY", key: "product_id" },
        { entity: "Inventory", type: "ONE_TO_MANY", key: "product_id" }
      ]
    },
    {
      name: "Order",
      type: "Commerce",
      fields: [
        { name: "id", type: "VARCHAR(255)", key: "PRIMARY" },
        { name: "customer_id", type: "VARCHAR(255)", nullable: false, foreign: "User.id" },
        { name: "order_number", type: "VARCHAR(50)", unique: true },
        { name: "total_amount", type: "DECIMAL(10,2)", nullable: false },
        { name: "status", type: "ENUM", values: ["pending","confirmed","shipped","delivered"] },
        { name: "items", type: "JSON" },
        { name: "shipping_address", type: "JSON" },
        { name: "created_date", type: "TIMESTAMP" }
      ],
      indexes: [
        "idx_customer (customer_id)",
        "idx_status (status)",
        "idx_date (created_date DESC)"
      ],
      relationships: [
        { entity: "User", type: "MANY_TO_ONE", key: "customer_id" },
        { entity: "OrderFulfillment", type: "ONE_TO_ONE", key: "order_id" }
      ]
    },
    {
      name: "CustomerLoyalty",
      type: "Commerce",
      fields: [
        { name: "id", type: "VARCHAR(255)", key: "PRIMARY" },
        { name: "user_id", type: "VARCHAR(255)", unique: true, foreign: "User.id" },
        { name: "total_points", type: "INT", default: 0 },
        { name: "lifetime_points", type: "INT", default: 0 },
        { name: "current_tier", type: "ENUM", values: ["bronze","silver","gold","platinum","diamond"] },
        { name: "total_spent", type: "DECIMAL(10,2)", default: 0 }
      ],
      indexes: [
        "idx_user (user_id)",
        "idx_tier (current_tier)",
        "idx_points (total_points DESC)"
      ],
      relationships: [
        { entity: "User", type: "ONE_TO_ONE", key: "user_id" },
        { entity: "LoyaltyProgram", type: "MANY_TO_ONE", key: "current_tier" }
      ]
    }
  ];

  const filteredSchemas = entitySchemas.filter(schema =>
    !searchQuery || schema.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportSchema = () => {
    const schema = `-- Database Schema Export
-- Generated: ${new Date().toISOString()}

${entitySchemas.map(e => `
CREATE TABLE ${e.name} (
${e.fields.map(f => `  ${f.name} ${f.type}${f.nullable === false ? ' NOT NULL' : ''}${f.default ? ` DEFAULT ${f.default}` : ''}${f.key ? ` ${f.key} KEY` : ''}`).join(',\n')}
);

${e.indexes?.map(idx => `CREATE INDEX ${idx};`).join('\n')}
`).join('\n')}`;

    const blob = new Blob([schema], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database_schema.sql';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Database Schema Viewer</h2>
          <p className="text-slate-400 font-semibold">Visual schema explorer with relationships</p>
        </div>
        <Button onClick={exportSchema} className="bg-cyan-500 hover:bg-cyan-600">
          <Download className="w-4 h-4 mr-2" />
          Export Schema SQL
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search entities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#1a1f3a] border-slate-700 text-white"
        />
      </div>

      {/* Entity List */}
      <div className="grid md:grid-cols-3 gap-4">
        {filteredSchemas.map((schema) => (
          <Card
            key={schema.name}
            onClick={() => setSelectedEntity(schema)}
            className={`cursor-pointer transition-all ${
              selectedEntity?.name === schema.name
                ? 'bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border-cyan-500'
                : 'bg-[#1a1f3a] border-slate-700 hover:border-cyan-500/50'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-black text-lg mb-1">{schema.name}</h3>
                  <Badge className="bg-purple-500">{schema.type}</Badge>
                </div>
                <Table className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fields:</span>
                  <span className="text-white font-bold">{schema.fields.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Indexes:</span>
                  <span className="text-white font-bold">{schema.indexes?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Relations:</span>
                  <span className="text-white font-bold">{schema.relationships?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Entity Details */}
      {selectedEntity && (
        <Card className="bg-[#1a1f3a] border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white font-bold text-xl">{selectedEntity.name} Schema</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Fields */}
            <div>
              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyan-400" />
                Fields ({selectedEntity.fields.length})
              </h4>
              <div className="space-y-2">
                {selectedEntity.fields.map((field, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <code className="text-cyan-400 font-mono font-bold">{field.name}</code>
                        {field.key && <Badge className="bg-amber-500 text-xs">{field.key}</Badge>}
                        {field.unique && <Badge className="bg-purple-500 text-xs">UNIQUE</Badge>}
                        {field.indexed && <Badge className="bg-green-500 text-xs">INDEXED</Badge>}
                      </div>
                      <code className="text-slate-400 font-mono text-sm">{field.type}</code>
                    </div>
                    <div className="flex gap-2 text-xs">
                      {field.nullable === false && <Badge className="bg-red-500/20 text-red-300">NOT NULL</Badge>}
                      {field.default && <Badge className="bg-blue-500/20 text-blue-300">DEFAULT: {field.default}</Badge>}
                      {field.foreign && <Badge className="bg-purple-500/20 text-purple-300">FK → {field.foreign}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Indexes */}
            {selectedEntity.indexes && selectedEntity.indexes.length > 0 && (
              <div>
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Key className="w-5 h-5 text-green-400" />
                  Indexes ({selectedEntity.indexes.length})
                </h4>
                <div className="space-y-2">
                  {selectedEntity.indexes.map((index, idx) => (
                    <div key={idx} className="p-3 bg-green-900/10 border border-green-500/30 rounded-lg">
                      <code className="text-green-300 font-mono text-sm">{index}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relationships */}
            {selectedEntity.relationships && selectedEntity.relationships.length > 0 && (
              <div>
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-purple-400" />
                  Relationships ({selectedEntity.relationships.length})
                </h4>
                <div className="space-y-2">
                  {selectedEntity.relationships.map((rel, idx) => (
                    <div key={idx} className="p-3 bg-purple-900/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-500">{rel.type}</Badge>
                          <code className="text-purple-300 font-mono">{selectedEntity.name}</code>
                          <GitBranch className="w-4 h-4 text-purple-400" />
                          <code className="text-purple-300 font-mono">{rel.entity}</code>
                        </div>
                        <code className="text-slate-400 text-xs">{rel.key}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate SQL */}
            <div>
              <h4 className="text-white font-bold mb-3">CREATE TABLE Statement</h4>
              <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 relative">
                <Button
                  size="sm"
                  onClick={() => {
                    const sql = generateCreateSQL(selectedEntity);
                    navigator.clipboard.writeText(sql);
                    alert('SQL copied to clipboard!');
                  }}
                  className="absolute top-2 right-2 bg-cyan-500 hover:bg-cyan-600"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy SQL
                </Button>
                <pre className="text-green-400 font-mono text-xs overflow-x-auto">
                  {generateCreateSQL(selectedEntity)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function generateCreateSQL(schema) {
  return `CREATE TABLE ${schema.name} (
${schema.fields.map(f => 
  `  ${f.name} ${f.type}${f.nullable === false ? ' NOT NULL' : ''}${f.default ? ` DEFAULT ${f.default}` : ''}${f.key ? ` ${f.key} KEY` : ''}`
).join(',\n')}
);

${schema.indexes?.map(idx => `CREATE INDEX ${idx};`).join('\n') || ''}

${schema.relationships?.map(rel => 
  `ALTER TABLE ${schema.name} ADD CONSTRAINT fk_${schema.name.toLowerCase()}_${rel.key}
  FOREIGN KEY (${rel.key}) REFERENCES ${rel.entity}(id);`
).join('\n') || ''}`;
}
