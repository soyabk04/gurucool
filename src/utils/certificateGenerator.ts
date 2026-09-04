import {
    PDFDocument,
    rgb,
    StandardFonts,
} from "pdf-lib";

import axios from "axios";
import mongoose from "mongoose";

import { Usermodel } from "../models/user.model.js";
import { Organizationmodel } from "../models/organization.model.js";
import { Groupmodel } from "../models/organization.model.js";
import { CourseModel } from "../models/course.model.js";

import { R2Service } from "../utils/cloudflare.js";
import { AppError } from "../errors/AppError.js";


export interface GenerateCertificateInput {
    organizationId: string;
    groupId: string;
    courseId: string;
    userId: string;
    certTemplateLink: string;
}


export interface GenerateCertificateResult {
    key: string;
    userId: string;
    courseId: string;
    issuedAt: Date;
}


export const generateCertificate = async ({
    organizationId,
    groupId,
    courseId,
    userId,
    certTemplateLink,
}: GenerateCertificateInput): Promise<GenerateCertificateResult> => {

    // =========================================================
    // 1. Validate IDs
    // =========================================================

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw new AppError(
            "Invalid organization ID",
            400,
            "INVALID_ORGANIZATION_ID"
        );
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
        throw new AppError(
            "Invalid group ID",
            400,
            "INVALID_GROUP_ID"
        );
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new AppError(
            "Invalid course ID",
            400,
            "INVALID_COURSE_ID"
        );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError(
            "Invalid user ID",
            400,
            "INVALID_USER_ID"
        );
    }


    // =========================================================
    // 2. Validate certificate template
    // =========================================================

    if (!certTemplateLink) {
        throw new AppError(
            "Certificate template link is required",
            400,
            "CERTIFICATE_TEMPLATE_REQUIRED"
        );
    }


    // =========================================================
    // 3. Fetch required data
    // =========================================================

    const [
        user,
        organization,
        group,
        course,
    ] = await Promise.all([

        Usermodel.findById(userId)
            .select("name firstName lastName email"),

        Organizationmodel.findById(organizationId)
            .select("name"),

        Groupmodel.findById(groupId)
            .select("name"),

        CourseModel.findById(courseId)
            .select("name title"),
    ]);


    // =========================================================
    // 4. Validate records
    // =========================================================

    if (!user) {
        throw new AppError(
            "User not found",
            404,
            "USER_NOT_FOUND"
        );
    }

    if (!organization) {
        throw new AppError(
            "Organization not found",
            404,
            "ORGANIZATION_NOT_FOUND"
        );
    }

    if (!group) {
        throw new AppError(
            "Group not found",
            404,
            "GROUP_NOT_FOUND"
        );
    }

    if (!course) {
        throw new AppError(
            "Course not found",
            404,
            "COURSE_NOT_FOUND"
        );
    }


    // =========================================================
    // 5. Get user's name
    // =========================================================

    const userName =
        user.name


    if (!userName) {
        throw new AppError(
            "User does not have a valid name",
            400,
            "USER_NAME_NOT_FOUND"
        );
    }


    // =========================================================
    // 6. Download certificate template
    // =========================================================

    let templateResponse;

    try {

        templateResponse = await axios.get(
            certTemplateLink,
            {
                responseType: "arraybuffer",
                timeout: 30000,
            }
        );

    } catch (error) {

        console.error(
            "Certificate template download failed:",
            error
        );

        throw new AppError(
            "Failed to download certificate template",
            500,
            "CERTIFICATE_TEMPLATE_DOWNLOAD_FAILED"
        );
    }


    const templateBytes =
        Buffer.from(templateResponse.data);


    // =========================================================
    // 7. Load PDF
    // =========================================================

    let pdfDoc: PDFDocument;

    try {

        pdfDoc =
            await PDFDocument.load(
                templateBytes
            );

    } catch (error) {

        console.error(
            "Invalid certificate PDF:",
            error
        );

        throw new AppError(
            "Invalid certificate template",
            400,
            "INVALID_CERTIFICATE_TEMPLATE"
        );
    }


    // =========================================================
    // 8. Get first page
    // =========================================================

    const pages =
        pdfDoc.getPages();

    if (!pages.length) {
        throw new AppError(
            "Certificate template has no pages",
            400,
            "CERTIFICATE_TEMPLATE_EMPTY"
        );
    }

    const page = pages[0];


    // =========================================================
    // 9. Embed font
    // =========================================================

    const font =
        await pdfDoc.embedFont(
            StandardFonts.TimesRoman
        );


    // =========================================================
    // 10. Get PDF dimensions
    // =========================================================

    const pageWidth =
        page.getWidth();

    const pageHeight =
        page.getHeight();


    console.log(
        "Certificate page dimensions:",
        {
            width: pageWidth,
            height: pageHeight,
        }
    );


    // =========================================================
    // 11. MM → PDF points
    // =========================================================

    const MM_TO_PT =
        72 / 25.4;


    // =========================================================
    // 12. NAME POSITION
    // =========================================================
    //
    // Position from TOP = 95mm
    //
    // Name is horizontally centered.
    //

    const nameTop = 95;

    const fontSize = 28;


    // pdf-lib starts Y from the bottom.
    //
    // Convert top-based position to
    // bottom-based position.

    const nameY =
        pageHeight -
        nameTop * MM_TO_PT -
        fontSize;


    // =========================================================
    // 13. Calculate centered X
    // =========================================================

    const textWidth =
        font.widthOfTextAtSize(
            userName,
            fontSize
        );

    const nameX =
        (pageWidth - textWidth) / 2;


    // =========================================================
    // 14. Draw user name
    // =========================================================

    page.drawText(
        userName,
        {
            x: nameX,

            y: nameY,

            size: fontSize,

            font,

            color: rgb(
                0.05,
                0.12,
                0.22
            ),
        }
    );


    // =========================================================
    // 15. Current date
    // =========================================================

    const issuedAt =
        new Date();


    const currentDate =
        `${String(
            issuedAt.getDate()
        ).padStart(2, "0")}-` +

        `${String(
            issuedAt.getMonth() + 1
        ).padStart(2, "0")}-` +

        `${issuedAt.getFullYear()}`;


    // =========================================================
    // 16. Draw date
    // =========================================================

    page.drawText(
        currentDate,
        {
            x: 170,

            y: 108,

            size: 16,

            font,

            color: rgb(
                0.05,
                0.12,
                0.22
            ),
        }
    );


    // =========================================================
    // 17. Serialize PDF
    // =========================================================

    let pdfBytes: Uint8Array;

    try {

        pdfBytes =
            await pdfDoc.save();

    } catch (error) {

        console.error(
            "Failed to generate PDF:",
            error
        );

        throw new AppError(
            "Failed to generate certificate PDF",
            500,
            "CERTIFICATE_GENERATION_FAILED"
        );
    }


    // =========================================================
    // 18. Create R2 key
    // =========================================================

    const key =
        `Courses/${courseId}/certificates/${userId}.pdf`;


    // =========================================================
    // 19. Upload generated PDF to R2
    // =========================================================
    //
    // IMPORTANT:
    // Do NOT use R2Service.upload() here.
    //
    // upload() expects Express.Multer.File.
    //
    // pdf-lib gives us a Buffer.
    //
    // Therefore use uploadBuffer().
    //

    const uploaded =
        await R2Service.uploadBuffer(
            Buffer.from(pdfBytes),
            key,
            "application/pdf"
        );


    if (!uploaded) {

        throw new AppError(
            "Failed to upload certificate",
            500,
            "CERTIFICATE_UPLOAD_FAILED"
        );
    }


    // =========================================================
    // 20. Return result
    // =========================================================

    return {
        key,

        userId,

        courseId,

        issuedAt,
    };
};