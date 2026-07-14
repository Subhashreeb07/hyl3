import org.flywaydb.core.Flyway;

public class DbCreate {
    public static void main(String[] args) {
        try {
            Flyway flyway = Flyway.configure().cleanDisabled(false).dataSource("jdbc:postgresql://localhost:5432/hyhub", "hyhub_app", "hyhub_app").load();
            flyway.clean();
            System.out.println("Flyway clean executed successfully! Database is completely empty now.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
