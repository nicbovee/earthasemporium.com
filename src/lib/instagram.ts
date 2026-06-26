export type InstagramPost = {
	id: string;
	caption?: string;
	mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
	mediaUrl: string;
	permalink: string;
	timestamp: string;
};

type GraphMediaItem = {
	id: string;
	caption?: string;
	media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
	media_url?: string;
	thumbnail_url?: string;
	permalink: string;
	timestamp: string;
	children?: {
		data: {
			media_url?: string;
			media_type?: string;
			thumbnail_url?: string;
		}[];
	};
};

const GRAPH_API_VERSION = 'v21.0';
const MEDIA_FIELDS =
	'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_url,media_type,thumbnail_url}';

function resolveMediaUrl(item: GraphMediaItem): string | null {
	if (item.media_type === 'VIDEO') {
		return item.thumbnail_url ?? null;
	}

	if (item.media_type === 'CAROUSEL_ALBUM') {
		const firstChild = item.children?.data?.[0];
		if (!firstChild) return item.media_url ?? null;
		if (firstChild.media_type === 'VIDEO') {
			return firstChild.thumbnail_url ?? firstChild.media_url ?? null;
		}
		return firstChild.media_url ?? null;
	}

	return item.media_url ?? null;
}

function mapMediaItem(item: GraphMediaItem): InstagramPost | null {
	const mediaUrl = resolveMediaUrl(item);
	if (!mediaUrl) return null;

	return {
		id: item.id,
		caption: item.caption,
		mediaType: item.media_type,
		mediaUrl,
		permalink: item.permalink,
		timestamp: item.timestamp,
	};
}

export async function getInstagramPosts(limit = 6): Promise<InstagramPost[]> {
	const accessToken = import.meta.env.INSTAGRAM_ACCESS_TOKEN;
	const userId = import.meta.env.INSTAGRAM_USER_ID;

	if (!accessToken || !userId) {
		console.warn(
			'Instagram feed: INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_USER_ID not set. Showing fallback.',
		);
		return [];
	}

	const params = new URLSearchParams({
		fields: MEDIA_FIELDS,
		limit: String(limit),
		access_token: accessToken,
	});

	const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${userId}/media?${params}`;

	try {
		const response = await fetch(url);

		if (!response.ok) {
			const errorBody = await response.json().catch(() => ({}));
			const message =
				typeof errorBody === 'object' &&
				errorBody !== null &&
				'error' in errorBody &&
				typeof errorBody.error === 'object' &&
				errorBody.error !== null &&
				'message' in errorBody.error
					? String(errorBody.error.message)
					: response.statusText;
			console.warn(`Instagram feed: API request failed (${response.status}): ${message}`);
			return [];
		}

		const data = (await response.json()) as { data?: GraphMediaItem[] };

		if (!data.data?.length) {
			return [];
		}

		return data.data
			.map(mapMediaItem)
			.filter((post): post is InstagramPost => post !== null)
			.slice(0, limit);
	} catch (error) {
		console.warn(
			'Instagram feed: fetch failed.',
			error instanceof Error ? error.message : error,
		);
		return [];
	}
}
