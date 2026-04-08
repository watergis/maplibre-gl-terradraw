import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import { getPackageInfo } from '../routes/helpers.ts';

const git = simpleGit();
const EXAMPLES_DIR = path.resolve('static/assets/examples');
const OUTPUT_FILE = path.resolve('src/lib/generated/authors.json');
const pkg = await getPackageInfo();

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
		const authors = result.split('\n').filter(Boolean);
		return authors.at(-1) ?? pkg.author.name;
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
			htmlFile = files.find((f) => f.endsWith('.htm'));

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
	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(authorsMap, null, 2));
	console.log(`\n Authors generated → ${OUTPUT_FILE}`);
}

generateAuthors();
