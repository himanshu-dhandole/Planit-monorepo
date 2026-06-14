package com.teamarc.planit.utils;

import com.uploadcare.upload.FileUploader;
import com.uploadcare.upload.UploadFailureException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import com.uploadcare.api.Client;



@Service
@RequiredArgsConstructor
public class FileService {

    private final Client client;

    public String uploadFile(MultipartFile multipartFile) {

        if(multipartFile.isEmpty()){
            throw new RuntimeException("File is empty");
        }
        File tempfile = null;
        try{
            String originalFilename = multipartFile.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            } else {
                extension = ".tmp";
            }


            tempfile = File.createTempFile("upload-", extension);
            try (java.io.InputStream inputStream = multipartFile.getInputStream()) {
                java.nio.file.Files.copy(inputStream, tempfile.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }

            FileUploader uploader = new FileUploader(client, tempfile);
            uploader.store(true);
            com.uploadcare.api.File uploadedFile = uploader.upload();

            return "https://ucarecdn.com/" + uploadedFile.getOriginalFilename() + "/";

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
