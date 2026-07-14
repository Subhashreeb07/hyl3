import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbDropHyland {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5433/postgres", "postgres", "071825");
            Statement stmt = conn.createStatement();
            stmt.executeUpdate("DROP DATABASE IF EXISTS hyland WITH (FORCE)");
            stmt.executeUpdate("CREATE DATABASE hyland");
            System.out.println("SUCCESSFULLY RECREATED hyland DATABASE ON PORT 5433");
            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
