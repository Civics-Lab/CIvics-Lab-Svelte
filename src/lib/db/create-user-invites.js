"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/lib/db/create-user-invites.ts
var postgres_1 = require("postgres");
var dotenv_1 = require("dotenv");
var fs_1 = require("fs");
var path_1 = require("path");
// Load environment variables
dotenv_1.default.config();
// Get database connection string
var connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var sql, enumExists, tableExists, columns, error_1, indexPath, indexContent;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('🔄 Creating user_invites table...');
                console.log("Using database: ".concat(connectionString.split('@')[1]));
                sql = (0, postgres_1.default)(connectionString, { ssl: 'require' });
                _a.label = 1;
            case 1:
                _a.trys.push([1, 14, 15, 17]);
                return [4 /*yield*/, sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT EXISTS (\n        SELECT 1\n        FROM pg_type\n        WHERE typname = 'invite_status'\n      ) as exists;\n    "], ["\n      SELECT EXISTS (\n        SELECT 1\n        FROM pg_type\n        WHERE typname = 'invite_status'\n      ) as exists;\n    "])))];
            case 2:
                enumExists = _a.sent();
                if (!!enumExists[0].exists) return [3 /*break*/, 4];
                console.log('Creating invite_status enum...');
                return [4 /*yield*/, sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n        CREATE TYPE \"invite_status\" AS ENUM('Pending', 'Accepted', 'Declined', 'Expired');\n      "], ["\n        CREATE TYPE \"invite_status\" AS ENUM('Pending', 'Accepted', 'Declined', 'Expired');\n      "])))];
            case 3:
                _a.sent();
                console.log('✅ Created invite_status enum');
                return [3 /*break*/, 5];
            case 4:
                console.log('✅ invite_status enum already exists');
                _a.label = 5;
            case 5: return [4 /*yield*/, sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      SELECT EXISTS (\n        SELECT 1\n        FROM information_schema.tables\n        WHERE table_name = 'user_invites'\n      ) as exists;\n    "], ["\n      SELECT EXISTS (\n        SELECT 1\n        FROM information_schema.tables\n        WHERE table_name = 'user_invites'\n      ) as exists;\n    "])))];
            case 6:
                tableExists = _a.sent();
                if (!!tableExists[0].exists) return [3 /*break*/, 11];
                console.log('Creating user_invites table...');
                // Create the user_invites table
                return [4 /*yield*/, sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n        CREATE TABLE \"user_invites\" (\n          \"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n          \"email\" text NOT NULL,\n          \"workspace_id\" uuid REFERENCES \"workspaces\"(\"id\"),\n          \"role\" \"workspace_role\" DEFAULT 'Basic User',\n          \"status\" \"invite_status\" DEFAULT 'Pending',\n          \"invited_by\" uuid REFERENCES \"users\"(\"id\"),\n          \"invited_at\" timestamp DEFAULT now(),\n          \"expires_at\" timestamp,\n          \"accepted_at\" timestamp,\n          \"token\" text NOT NULL UNIQUE\n        );\n      "], ["\n        CREATE TABLE \"user_invites\" (\n          \"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n          \"email\" text NOT NULL,\n          \"workspace_id\" uuid REFERENCES \"workspaces\"(\"id\"),\n          \"role\" \"workspace_role\" DEFAULT 'Basic User',\n          \"status\" \"invite_status\" DEFAULT 'Pending',\n          \"invited_by\" uuid REFERENCES \"users\"(\"id\"),\n          \"invited_at\" timestamp DEFAULT now(),\n          \"expires_at\" timestamp,\n          \"accepted_at\" timestamp,\n          \"token\" text NOT NULL UNIQUE\n        );\n      "])))];
            case 7:
                // Create the user_invites table
                _a.sent();
                console.log('✅ Created user_invites table');
                // Create indexes
                console.log('Creating indexes...');
                return [4 /*yield*/, sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n        CREATE INDEX \"user_invites_email_idx\" ON \"user_invites\" (\"email\");\n      "], ["\n        CREATE INDEX \"user_invites_email_idx\" ON \"user_invites\" (\"email\");\n      "])))];
            case 8:
                _a.sent();
                return [4 /*yield*/, sql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n        CREATE INDEX \"user_invites_workspace_id_idx\" ON \"user_invites\" (\"workspace_id\");\n      "], ["\n        CREATE INDEX \"user_invites_workspace_id_idx\" ON \"user_invites\" (\"workspace_id\");\n      "])))];
            case 9:
                _a.sent();
                return [4 /*yield*/, sql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n        CREATE INDEX \"user_invites_token_idx\" ON \"user_invites\" (\"token\");\n      "], ["\n        CREATE INDEX \"user_invites_token_idx\" ON \"user_invites\" (\"token\");\n      "])))];
            case 10:
                _a.sent();
                console.log('✅ Created indexes on user_invites table');
                return [3 /*break*/, 12];
            case 11:
                console.log('✅ user_invites table already exists');
                _a.label = 12;
            case 12:
                // Verify columns
                console.log('Verifying table structure...');
                return [4 /*yield*/, sql(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n      SELECT column_name\n      FROM information_schema.columns\n      WHERE table_name = 'user_invites';\n    "], ["\n      SELECT column_name\n      FROM information_schema.columns\n      WHERE table_name = 'user_invites';\n    "])))];
            case 13:
                columns = _a.sent();
                console.log('Table columns:', columns.map(function (c) { return c.column_name; }));
                console.log('✅ Setup completed successfully');
                return [3 /*break*/, 17];
            case 14:
                error_1 = _a.sent();
                console.error('❌ Setup failed:', error_1);
                process.exit(1);
                return [3 /*break*/, 17];
            case 15: 
            // End the connection
            return [4 /*yield*/, sql.end()];
            case 16:
                // End the connection
                _a.sent();
                return [7 /*endfinally*/];
            case 17:
                // Update the index.ts file to export userInvites
                try {
                    indexPath = path_1.default.join(process.cwd(), 'src', 'lib', 'db', 'drizzle', 'index.ts');
                    indexContent = fs_1.default.readFileSync(indexPath, 'utf8');
                    // Check if userInvites is already exported
                    if (!indexContent.includes('export * from')) {
                        // Assuming the file needs to be updated to export everything
                        indexContent = "import { drizzle } from 'drizzle-orm/postgres-js';\nimport postgres from 'postgres';\nimport * as schema from './schema';\n\n// Get database URL from environment variables\nconst connectionString = process.env.DATABASE_URL || '';\n\n// Create postgres connection\nconst client = postgres(connectionString, { ssl: 'require' });\n\n// Create database instance with all schemas\nexport const db = drizzle(client, { schema });\n\n// Export everything from schema\nexport * from './schema';\n";
                        fs_1.default.writeFileSync(indexPath, indexContent);
                        console.log('✅ Updated index.ts to export schema');
                    }
                    else {
                        console.log('✅ index.ts already exports schema');
                    }
                }
                catch (err) {
                    console.error('⚠️ Could not update index.ts file:', err);
                }
                return [2 /*return*/];
        }
    });
}); };
main();
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
