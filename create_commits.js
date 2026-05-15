const { execSync } = require('child_process');

function runCmd(cmd) {
    try {
        console.log(`Running: ${cmd}`);
        return execSync(cmd, { encoding: 'utf8' });
    } catch (e) {
        console.error(`Error running ${cmd}: ${e.message}`);
        if (e.stdout) console.error(e.stdout);
        if (e.stderr) console.error(e.stderr);
        return "";
    }
}

const statusOutput = runCmd('git status --porcelain');
if (!statusOutput) {
    console.log('No changes to commit');
    process.exit(0);
}

const lines = statusOutput.trim().split('\n');
const files = lines.map(line => {
    // line format: " M path/to/file", "?? path/to/file", " D path/to/file"
    const status = line.substring(0, 2);
    const path = line.substring(3).trim();
    // handle renames like "R  old -> new"
    if (path.includes(' -> ')) {
        return path.split(' -> ')[1];
    }
    return path;
});

const buckets = [
    {
        name: "chore: cleanup legacy test and debug APIs and routes",
        patterns: [
            "test", "debug", "src/lib/auth.ts", "seed", "route-backup.ts",
            "CanteenBuddyAssistant.tsx", "CanteenBuddyEliteTracker.tsx"
        ]
    },
    {
        name: "refactor: update mongoose models for core entities",
        patterns: ["src/lib/models/", "src/models/"]
    },
    {
        name: "feat: enhance AI orchestration and feedback intelligence",
        patterns: ["src/lib/ai/"]
    },
    {
        name: "refactor: analytics and metrics data blending logic",
        patterns: ["src/lib/analytics/"]
    },
    {
        name: "refactor: modularize auth helper and core services",
        patterns: ["src/lib/auth-helper.ts", "src/lib/auth/", "src/lib/services/"]
    },
    {
        name: "refactor: admin utilities and websocket services",
        patterns: ["src/lib/adminUtils.ts", "src/lib/slot-utils.ts", "src/lib/order-socket.ts", "src/lib/websocket/", "src/lib/db.ts", "src/lib/security/"]
    },
    {
        name: "refactor: order constants, types and context improvements",
        patterns: ["src/constants/", "src/types/", "src/context/", "src/lib/hooks/"]
    },
    {
        name: "chore: config updates and new scripts",
        patterns: ["next.config.mjs", "package.json", "tsconfig.json", ".txt", ".png", "scripts/", "src/scripts/"]
    },
    {
        name: "feat: rename and update AI assistant components",
        patterns: ["QwikBiteAssistant", "QwikBiteEliteTracker"]
    },
    {
        name: "feat: update home and premium UI components",
        patterns: ["src/components/home/", "src/components/premium/", "src/components/Footer.tsx", "src/components/FullNavigationHeader.tsx"]
    },
    {
        name: "feat: enhance customer components and order tracking UI",
        patterns: ["src/components/customer/", "src/components/order/", "src/components/orders/", "src/components/theme-provider.tsx", "src/components/ui/"]
    },
    {
        name: "feat: update admin dashboard and settings UI components",
        patterns: ["src/components/admin/", "src/app/admin/"]
    },
    {
        name: "feat: improve customer authentication pages and modals",
        patterns: ["src/components/auth/", "src/app/customer/profile/", "src/app/customer/favorites/"]
    },
    {
        name: "feat: update customer payment and order workflow pages",
        patterns: ["src/app/customer/payment/", "src/app/customer/orders/", "src/app/customer/order-summary/", "src/app/customer/layout.tsx", "src/app/layout.tsx"]
    },
    {
        name: "feat: backend updates for admin APIs and settings",
        patterns: ["src/app/api/admin/", "src/app/api/staff/", "src/app/api/inventory/", "src/app/api/dashboard/"]
    },
    {
        name: "feat: backend updates for orders and feedback APIs",
        patterns: ["src/app/api/orders/", "src/app/api/feedbacks/", "src/app/api/feedback-messages/", "src/app/api/health-check/", "src/app/api/assistant/", "src/app/api/system-notifications/", "src/app/api/notifications/"]
    },
    {
        name: "feat: backend updates for customer routes, auth APIs, and payments",
        patterns: ["src/app/api/customer/", "src/app/api/auth/", "src/app/api/favorites/", "src/app/api/payment", "src/app/customer/api/", "src/app/api/staffmanagement/"]
    }
];

let remainingFiles = [...files];

for (const bucket of buckets) {
    const matchedFiles = [];
    for (const file of remainingFiles) {
        if (bucket.patterns.some(pattern => file.includes(pattern))) {
            matchedFiles.push(file);
        }
    }
    
    if (matchedFiles.length > 0) {
        // chunk adds
        console.log(`Adding ${matchedFiles.length} files for bucket: ${bucket.name}`);
        // Windows CMD has arg length limits, so add files individually or in small chunks.
        for(const f of matchedFiles) {
            runCmd(`git add "${f}"`);
            
            // Also if it's a deleted file from git status, make sure it's added properly
            // 'git add -A' inside loop is too much. git add "filename" handles both changes and new files.
            // But deleted files need git add --all or git rm. Actually git add "filename" handles deletes too in newer git versions.
            // Let's run git add "f", if it fails, maybe it's already deleted.
        }
        
        // Actually to be safe with deleted files:
        runCmd(`git commit -m "${bucket.name}"`);
        
        remainingFiles = remainingFiles.filter(f => !matchedFiles.includes(f));
    }
}

// Final bucket for anything missed
if (remainingFiles.length > 0) {
    console.log(`Adding remaining ${remainingFiles.length} files`);
    for(const f of remainingFiles) {
        // Exclude scratch or node_modules if they appear
        if(!f.includes('scratch/') && !f.includes('node_modules/')) {
            runCmd(`git add "${f}"`);
        }
    }
    runCmd(`git commit -m "chore: other updates and miscellaneous fixes"`);
}

// Ensure deleted files are tracked
// Sometimes git add "file" on a deleted file might not stage the deletion properly if not using -A.
// To be perfectly safe, let's just do a final commit of anything left in working tree:
runCmd(`git add -A`);
try {
    const status2 = runCmd('git status --porcelain');
    if (status2 && status2.trim().length > 0) {
        runCmd(`git commit -m "chore: finalize remaining updates"`);
    }
} catch (e) {}

// Finally push
runCmd(`git push origin main`);
