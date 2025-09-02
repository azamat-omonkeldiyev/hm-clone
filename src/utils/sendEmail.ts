import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, text: string) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });


    await transporter.sendMail({
        from: `"Propanti Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    });
};
