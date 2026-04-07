import simpleGit from 'simple-git';
import path from 'path';

const git = simpleGit();

// simple in-memory cache (per server instance)
const authorCache = new Map<string, string>();

export async function getExampleFileAuthor(filePath: string): Promise<string> {
	const normalizedPath = path.normalize(filePath);

	if (authorCache.has(normalizedPath)) {
		return authorCache.get(normalizedPath)!;
	}

	try {
		const result = await git.raw([
			'log',
			'--diff-filter=A',
			'--follow',
			'--format=%an',
			'--',
			normalizedPath
		]);

		const authors = result.split('\n').filter(Boolean);

		const creator = authors[authors.length - 1] || 'Unknown';

		authorCache.set(normalizedPath, creator);

		return creator;
	} catch (err) {
		console.error(`Failed to get author for ${filePath}`, err);
		return 'Unknown';
	}
}
