import java.util.*;
import java.io.File;

public class FontShift{
    private static File currentDirectory = new File(System.getProperty("user.dir"));
    private static String pathTo = "/frontend";
    private static File searchDirectory;
    private static File[] fileList;

    File[] tsxFiles;
    File[] cssFiles;

    public static void main(String[] args){
        System.out.println("Hello, world!");

        searchDirectory = new File(currentDirectory + pathTo);
        fileList = searchDirectory.listFiles();

        for(int i = 0; i < fileList.length; i++){
            System.out.println(fileList[i].getName());
            String fileName = fileList[i].getName();
            int dotIndex = fileName.lastIndexOf(".");
            if(dotIndex == -1){
                System.out.println("No file extension found for " + fileName);
                continue;
            }

            String extension = fileName.substring(dotIndex + 1);

            if(extension == "tsx"){
                UpdateTSXFile(fileList[i]);
            }else if(extension == "css"){
                UpdateCSSFile(fileList[i]);
            }else{
                continue;
            }
        }
    }

    static void UpdateTSXFile(File file){
        
    }

    static void UpdateCSSFile(File file){

    }
}