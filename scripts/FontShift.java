import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;

public class FontShift{
    private static File currentDirectory = new File(System.getProperty("user.dir"));
    private static String pathTo = "/frontend/src";
    private static File searchDirectory;
    private static File[] fileList;

    File[] tsxFiles;
    File[] cssFiles;

    public static void main(String[] args){
        System.out.println("Hello, world!");
        searchDirectory = new File(currentDirectory + pathTo);
        ProcessDirectory(searchDirectory);
    }

    static void ProcessDirectory(File directory){
        File[] files = directory.listFiles();

        if(files == null) return;

        for(File file : files){
            if(file.isDirectory()){
                ProcessDirectory(file);
            }else{
                String fileName = file.getName();
                int dotIndex = fileName.lastIndexOf(".");

                if(dotIndex == -1) continue;

                String extension = fileName.substring(dotIndex + 1);

                if(extension.equals("tsx")){
                    UpdateTSXFile(file);
                }else if(extension.equals("css")){
                    UpdateCSSFile(file);
                }
            }
        }
    }

    static void UpdateTSXFile(File file){
        Pattern pattern = Pattern.compile(
            "fontSize\\s*:\\s*([\"']?)" +     // group(1): optional quote
            "(\\d+(?:\\.\\d+)?)" +            // group(2): number
            "(px)?" +                         // group(3): optional px
            "\\1"                             // matching closing quote
        );

        try {
            List<String> lines = Files.readAllLines(file.toPath());
            StringBuilder updatedContent = new StringBuilder();

            for (String line : lines) {
                Matcher matcher = pattern.matcher(line);
                StringBuffer sb = new StringBuffer();

                while (matcher.find()) {
                    String quote = matcher.group(1);
                    double value = Double.parseDouble(matcher.group(2));
                    String px = matcher.group(3); // null if no px

                    // Skip small values without px (likely already scaled units)
                    if (px == null && value <= 4) {
                        continue;
                    }

                    double remValue = (px != null) ? value / 16.0 : value / 16.0;

                    String replacement;
                    if (quote.isEmpty()) {
                        replacement = String.format("fontSize: \"%.3frem\"", remValue);
                    } else {
                        replacement = String.format("fontSize: %s%.3frem%s", quote, remValue, quote);
                    }

                    matcher.appendReplacement(sb, replacement);
                }

                matcher.appendTail(sb);
                updatedContent.append(sb).append("\n");
            }

            // Write updated content back to file
            Files.write(file.toPath(), updatedContent.toString().getBytes());

            System.out.println("Updated: " + file.getName());

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    static void UpdateCSSFile(File file){
        Pattern pattern = Pattern.compile(
            "font-size\\s*:\\s*(\\d+(?:\\.\\d+)?)px"
        );

        try {
            List<String> lines = Files.readAllLines(file.toPath());
            StringBuilder updatedContent = new StringBuilder();

            for (String line : lines) {
                Matcher matcher = pattern.matcher(line);
                StringBuffer sb = new StringBuffer();

                while (matcher.find()) {
                    double pxValue = Double.parseDouble(matcher.group(1));
                    double remValue = pxValue / 16.0;

                    String replacement = String.format("font-size: %.3frem", remValue);

                    matcher.appendReplacement(sb, replacement);
                }

                matcher.appendTail(sb);
                updatedContent.append(sb).append("\n");
            }

            // Write updated content back to file
            Files.write(file.toPath(), updatedContent.toString().getBytes());

            System.out.println("Updated CSS: " + file.getName());

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}