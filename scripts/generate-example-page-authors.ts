import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import { getPackageInfo } from '../src/routes/helpers.ts';

const git = simpleGit();
const EXAMPLES_DIR = path.resolve('static/assets/examples');
const OUTPUT_FILE = path.resolve('src/routes/authors.json');
const pkg = await getPackageInfo();

const BOT_PATTERNS = ['bot', 'copilot', 'ai', 'github', 'actions'];

function isBot(name: string): boolean {
	const lower = name.toLowerCase();
	return BOT_PATTERNS.some((pattern) => lower.includes(pattern));
}

async function getAuthor(filePath: string): Promise<string> {
	try {
		const result = await git.raw([
			'log',
			'--diff-filter=A',
			'--follow',
			'--format=%an',
			'--',
			filePath
		]);

		const authors = result
			.split('\n')
			.map((a) => a.trim())
			.filter(Boolean);

		const uniqueAuthors = [...new Set(authors)];

		// Filter out bots
		const humanAuthors = uniqueAuthors.filter((a) => !isBot(a));

		if (humanAuthors.length > 0) {
			return humanAuthors[0];
		}

		// fallback: if all are bots, try second author overall
		if (uniqueAuthors.length > 1) {
			return `${uniqueAuthors[1]} et al`;
		}

		return pkg.author.name;
	} catch {
		return pkg.author.name;
	}
}

async function generateAuthors() {
	const authorsMap: Record<string, string> = {};
	const entries = fs.readdirSync(EXAMPLES_DIR, { withFileTypes: true });

	for (const entry of entries) {
		let htmlFile: string | undefined;
		let exampleId: string;

		if (entry.isDirectory()) {
			exampleId = entry.name;
			const exampleDir = path.join(EXAMPLES_DIR, exampleId);
			const files = fs.readdirSync(exampleDir);
			htmlFile = files.find((f: string) => f.endsWith('.htm'));

			if (!htmlFile) {
				console.warn(`⚠️ No .htm file found in directory "${exampleId}"`);
				continue;
			}

			const filePath = path.join(exampleDir, htmlFile);
			authorsMap[exampleId] = await getAuthor(filePath);
		} else if (entry.name.endsWith('.htm')) {
			// Structure: examples/file.htm (flat)
			exampleId = path.basename(entry.name, '.htm');
			const filePath = path.join(EXAMPLES_DIR, entry.name);
			authorsMap[exampleId] = await getAuthor(filePath);
		} else {
			console.log(`⏭️ Skipping: ${entry.name}`);
			continue;
		}

		console.log(`✅ ${exampleId} → ${authorsMap[exampleId]}`);
	}

	fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(authorsMap, null, 1) + '\n');
	console.log(`\n Authors generated → ${OUTPUT_FILE}`);
}

generateAuthors();
