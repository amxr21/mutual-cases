'use client'
import Image from "next/image";
import { useEffect, useState } from "react";

const link = 'http://localhost:3000'

export default function GoogleLoginButton(){
    const[ user, setUser ] = useState()



    useEffect(() => {

        const token = localStorage.getItem("token")
        const name = localStorage.getItem("userName")
        const picture = localStorage.getItem("userPicture")
        // const googleId = localStorage.getItem("google_id")
        const userId = localStorage.getItem("userId")

        if (token && name) {
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
        const res = await fetch(`${link}/api/auth`, {
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
        }
    
    
    }


    if(user){
        return <>
            <div className="  top-0 left-0 flex gap-4 max-w-48">
                <div className="relative min-w-10 w-10 min-h-10 h-10 overflow-hidden rounded-2xl ">
                    <Image fill src={`${String(user?.picture)}`} alt="profile image" className=" object-cover" />
                </div>
                {/* <h2 className="text-base font-medium">{user?.name}</h2> */}
            </div>
        </>
    }



    return <div id="googleSignIn"></div>
}
