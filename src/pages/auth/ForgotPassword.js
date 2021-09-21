import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';


function ForgotPassword({history}) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const { user } = useSelector( (state) => ({ ...state }));

    useEffect(() => {
        if( user && user.token ) {
            history.push('/');
        }
    },[user, history])

  
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                url:process.env.REACT_APP_FORGOT_PASSWORD_REDIRECT_URL,
                handleCodeInApp:true
            }
            await auth.sendPasswordResetEmail(email, config);
            setEmail('');
            setLoading(false);
            toast.success('Check your email for password reset link.');
            // User reset their password with link to firebase pages
            // Then redirect to our login page
        } catch (error) {
            setLoading(false);
            toast.error(error.message);
        } 
    }


    return (
        <div className="container col-md-6 offset-md-3 p-5">
            {loading? <h4 className="text-danger">Loading...</h4> : <h4>Forgot Password</h4> }
            <form onSubmit={handleSubmit}>
                <input type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    autoFocus
                />
                <button className="btn btn-raised mt-3" disabled={!email}>Submit</button>

            </form>
        </div>
        
    )
}

export default ForgotPassword