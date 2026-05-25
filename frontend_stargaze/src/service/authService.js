const API_URL = "/api";
export async function getProfile() {

    const token =
        localStorage.getItem("token");

    const response = await fetch(
        "/api/auth/me",
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.json();
}