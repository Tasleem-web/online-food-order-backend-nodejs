// Email

// Notification

// OTP

export const GenerateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    let expiry = new Date();
    expiry.setTime(new Date().getTime() + (30 * 60 * 1000))
    return { otp, expiry }
}

export const OnRequestOtp = async (otp: number, toPhoneNumber: string) => {
    const accountSid = "AC0628b21b23b95bab06942d0d68d88cc6";
    const authToken = "1b54111257ba2530270e3cc8e1c8671e";
    const client = require('twilio')(accountSid, authToken);


    const response = await client.messages.create({
        body: `Your OTP is ${otp}`,
        from: "+12545705219",
        to: `+91${toPhoneNumber}`
    })

    return response;
}


// Payment notification or emails