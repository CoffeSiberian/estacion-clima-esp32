const dataGet = async (
	options: RequestInit | undefined,
	url: string
): Promise<Response | null> => {
	try {
		return await fetch(url, { ...options, method: "GET" });
	} catch {
		return null;
	}
};

const dataPost = async (
	options: RequestInit,
	payload: string | FormData,
	url: string
): Promise<Response | null> => {
	try {
		return await fetch(url, { ...options, method: "POST", body: payload });
	} catch {
		return null;
	}
};

const dataDelete = async (
	options: RequestInit,
	url: string
): Promise<Response | null> => {
	try {
		return await fetch(url, { ...options, method: "DELETE" });
	} catch {
		return null;
	}
};

const dataPut = async (
	options: RequestInit,
	payload: string | FormData,
	url: string
): Promise<Response | null> => {
	try {
		return await fetch(url, { ...options, method: "PUT", body: payload });
	} catch {
		return null;
	}
};

export { dataGet, dataPost, dataPut, dataDelete };
