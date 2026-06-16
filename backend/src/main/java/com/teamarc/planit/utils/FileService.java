package com.teamarc.planit.utils;

import com.uploadcare.upload.FileUploader;
import com.uploadcare.upload.UploadFailureException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import com.uploadcare.api.Client;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final Client client;

    public String uploadFile(MultipartFile multipartFile) {

        if (multipartFile.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        File tempfile = null;
        try {
            String originalFilename = multipartFile.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            } else {
                extension = ".tmp";
            }

            tempfile = File.createTempFile("upload-", extension);
            try (java.io.InputStream inputStream = multipartFile.getInputStream()) {
                java.nio.file.Files.copy(inputStream, tempfile.toPath(),
                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }

            FileUploader uploader = new FileUploader(client, tempfile);
            uploader.store(true); // ✅ CRITICAL FIX: Explicitly store the file in project

            com.uploadcare.api.File uploadedFile = uploader.upload();

            log.info("Uploaded File ID: {}", uploadedFile.getFileId());
            log.info("Uploaded File Original Name: {}", uploadedFile.getOriginalFilename());
            log.info("Uploaded File Size: {}", uploadedFile.getSize());
            log.info("File Stored: {}", uploadedFile.isStored()); // Verify storage

            String cdnUrl = "https://is1g9d2of8.ucarecd.net/" + uploadedFile.getFileId() + "/" + uploadedFile.getOriginalFilename();
            log.info("Generated CDN URL: {}", cdnUrl);
            return cdnUrl;

        } catch (IOException e) {
            throw new RuntimeException("File upload failed due to an I/O error", e);
        } catch (UploadFailureException e) {
            throw new RuntimeException("File upload failed due to Uploadcare error", e);
        } finally {
            if (tempfile != null && tempfile.exists()) {
                tempfile.delete();
            }
        }
    }

}
