import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbNewSchema {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/hyhub", "hyhub_app", "hyhub_app");
            Statement stmt = conn.createStatement();
            stmt.executeUpdate("CREATE SCHEMA IF NOT EXISTS hyhub_v2");
            System.out.println("SUCCESS creating schema hyhub_v2");
            stmt.close();
            conn.close();
        } catch (Exception e) {
            System.out.println("FAILED to create schema hyhub_v2: " + e.getMessage());
        }
    }
}
