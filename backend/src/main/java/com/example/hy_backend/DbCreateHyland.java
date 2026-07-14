import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbCreateHyland {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5434/postgres", "postgres", "071825");
            Statement stmt = conn.createStatement();
            stmt.executeUpdate("CREATE DATABASE hyland");
            System.out.println("SUCCESSFULLY CREATED hyland DATABASE ON PORT 5434");
            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
