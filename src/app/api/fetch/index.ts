export function request<Data>(url: string, method: string, data?: any) {
    return {
        url,
        method,
        data,
    } as {
        url: string;
        method: string;
        data: any;
        resData?: Data;
    };
}

export const Rocket = {
    get<Data>(url: string, query?: any) {
        return request<Data>(url, 'GET', query);
    },
    post<Data>(url: string, data?: any) {
        return request<Data>(url, 'POST', data);
    },
    put<Data>(url: string, data?: any) {
        return request<Data>(url, 'PUT', data);
    },
    delete<Data>(url: string, data?: any) {
        return request<Data>(url, 'DELETE', data);
    },
};
