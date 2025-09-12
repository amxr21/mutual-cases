'use client'
import Image from "next/image";
import { useEffect, useState } from "react";
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL

export default function GoogleLoginButton(){
    const[ user, setUser ] = useState()



    useEffect(() => {
        // console.log("API_ENDPOINT", `${API_ENDPOINT}/api/auth`);


        const token = localStorage.getItem("token")
        const name = localStorage.getItem("userName")
        const picture = localStorage.getItem("userPicture")
        // const googleId = localStorage.getItem("google_id")
        const userId = localStorage.getItem("userId")

        if (token && name && picture && userId) {
            setUser({ name, picture, userId });
        } 
        else {
            // Initialize Google button if no token
            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
            });
            window.google.accounts.id.renderButton(
                document.getElementById("googleSignIn"),
                { theme: "outline", size: "large" }
            );
        }

    }, [])



    const handleCredentialResponse = async (response) => {            
        const res = await fetch(`${API_ENDPOINT}/api/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: response.credential })
        })
    
        const data = await res.json();
        if(data.success){
            localStorage.setItem("token", data.token);
            localStorage.setItem("userName", data.name);
            localStorage.setItem("userPicture", data.picture);
            // localStorage.setItem("googleId", data.googleId);
            localStorage.setItem("userId", data.userId);
            // token, name, email, picture
            setUser({name:data.name, picture: data.picture, userId: data.userId })
            console.log(data );
            
            localStorage.setItem('token', data.token)



            const googleButtonDiv = document.getElementById("googleSignIn");
            if (googleButtonDiv) googleButtonDiv.style.display = "none";
        }
    
    
    }

    return user ? <>
            <div className="grow top-0 left-0 flex items-center gap-4 mx-4">
                <div className="relative min-w-10 w-10 min-h-10 h-10 overflow-hidden rounded-2xl ">
                    <Image fill src={`${String(user?.picture)}`} alt="profile image" className=" object-cover" />
                </div>
                {/* <h2 className="text-base font-medium">{user?.name}</h2> */}
            </div>
        </>

        : !user && <div id="googleSignIn"></div>


}
