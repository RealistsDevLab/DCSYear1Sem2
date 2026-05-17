/*
 * ============================================================
 *  Import and Logistics Shipment Management System
 *  Developed for: Logistics Managers tracking imported goods
 *                 from Alibaba / AliExpress to Uganda warehouses
 *
 *  Group Members:
 *    Muyinda Joseph, Nalwanga Desire, Atwongiire Jonas,
 *    Kamuliso Samuel, Okoi Tabica, Tumwebaze Jordan,
 *    Okello Emma, Ashaba Kenneth, Ssegawa Tonny,
 *    Okello Stephen, Friday Isaac
 *
 *  Language : C
 *  Data File: shipment_manifest.dat (binary)
 * ============================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ============================================================
 *  CONSTANTS
 * ============================================================ */
#define MAX_SHIPMENTS     100
#define TRACKING_ID_LEN   20
#define NAME_LEN          50
#define DESC_LEN          100
#define DATA_FILE         "shipment_manifest.dat"

/* Shipping rate constants (UGX per kg) */
#define AIR_RATE_PER_KG   35000.0   /* Air freight rate per kg  */
#define SEA_RATE_PER_KG   12000.0   /* Sea freight rate per kg  */
#define URA_FEE_RATE      0.06      /* 6% of shipping charge    */
#define HANDLING_FEE_RATE 0.03      /* 3% of shipping charge    */

/* ============================================================
 *  DATA STRUCTURE – Shipment
 * ============================================================ */
typedef struct {
    char   trackingID[TRACKING_ID_LEN]; /* Unique shipment identifier        */
    char   supplierName[NAME_LEN];      /* e.g. Alibaba supplier             */
    char   itemDescription[DESC_LEN];  /* Brief item description            */
    float  weightKg;                   /* Weight in kilograms               */
    int    shippingMode;               /* 1 = Air,  2 = Sea                 */
    int    status;                     /* 1=In Transit 2=At Customs 3=Arrived*/
    double shippingCost;               /* Freight charge (auto-calculated)  */
    double uraFees;                    /* URA clearing fees                 */
    double handlingCharges;            /* Warehouse / handling charges      */
} Shipment;

/* ============================================================
 *  GLOBAL ARRAY – holds shipments in memory during runtime
 * ============================================================ */
Shipment shipments[MAX_SHIPMENTS];
int      totalShipments = 0;          /* Number of records loaded/added    */

/* ============================================================
 *  FORWARD DECLARATIONS
 * ============================================================ */
void   loadFromFile(void);
void   saveToFile(void);
void   addShipment(void);
void   updateStatus(void);
void   searchShipment(void);
void   calculateCosts(void);
void   displayAll(void);
void   printShipment(const Shipment *s);
void   printDivider(void);
const char *modeName(int mode);
const char *statusName(int status);
double computeShippingCost(float weightKg, int mode);

/* ============================================================
 *  MAIN – Menu loop
 * ============================================================ */
int main(void) {
    int choice;

    /* Load any existing records from the binary data file */
    loadFromFile();

    printf("\n");
    printf("  ╔══════════════════════════════════════════════════╗\n");
    printf("  ║   IMPORT & LOGISTICS SHIPMENT MANAGEMENT SYSTEM  ║\n");
    printf("  ║          Entebbe / Uganda Entry Points           ║\n");
    printf("  ╚══════════════════════════════════════════════════╝\n");

    /* Keep showing the menu until the user chooses Exit */
    do {
        printf("\n  ┌─────────────────────────────────┐\n");
        printf("  │           MAIN MENU             │\n");
        printf("  ├─────────────────────────────────┤\n");
        printf("  │  1. Add Shipment Record         │\n");
        printf("  │  2. Update Shipment Status      │\n");
        printf("  │  3. Search Shipment             │\n");
        printf("  │  4. Calculate Shipping Costs    │\n");
        printf("  │  5. Display All Records         │\n");
        printf("  │  6. Exit Program                │\n");
        printf("  └─────────────────────────────────┘\n");
        printf("  Enter choice: ");
        scanf("%d", &choice);
        getchar(); /* consume newline left by scanf */

        switch (choice) {
            case 1: addShipment();   break;
            case 2: updateStatus();  break;
            case 3: searchShipment(); break;
            case 4: calculateCosts(); break;
            case 5: displayAll();    break;
            case 6:
                /* Save all records before exiting */
                saveToFile();
                printf("\n  Records saved to '%s'. Goodbye!\n\n", DATA_FILE);
                break;
            default:
                printf("\n  [!] Invalid choice. Please enter 1-6.\n");
        }
    } while (choice != 6);

    return 0;
}

/* ============================================================
 *  FILE HANDLING – Load records from binary file at startup
 * ============================================================ */
void loadFromFile(void) {
    FILE *fp = fopen(DATA_FILE, "rb");
    if (fp == NULL) {
        /* File doesn't exist yet – first run */
        printf("\n  [i] No existing data file found. Starting fresh.\n");
        return;
    }

    /* Read all shipment structs stored in the file */
    totalShipments = (int)fread(shipments, sizeof(Shipment),
                                MAX_SHIPMENTS, fp);
    fclose(fp);
    printf("\n  [i] Loaded %d shipment record(s) from '%s'.\n",
           totalShipments, DATA_FILE);
}

/* ============================================================
 *  FILE HANDLING – Save all records to binary file
 * ============================================================ */
void saveToFile(void) {
    FILE *fp = fopen(DATA_FILE, "wb");
    if (fp == NULL) {
        printf("\n  [!] ERROR: Could not open '%s' for writing.\n", DATA_FILE);
        return;
    }
    fwrite(shipments, sizeof(Shipment), totalShipments, fp);
    fclose(fp);
}

/* ============================================================
 *  FUNCTION 1 – Add a new shipment record
 * ============================================================ */
void addShipment(void) {
    if (totalShipments >= MAX_SHIPMENTS) {
        printf("\n  [!] Maximum shipment capacity reached (%d).\n",
               MAX_SHIPMENTS);
        return;
    }

    Shipment *s = &shipments[totalShipments]; /* Pointer to new slot */

    printf("\n  ── ADD NEW SHIPMENT RECORD ──────────────────────\n");

    printf("  Tracking ID       : ");
    fgets(s->trackingID, TRACKING_ID_LEN, stdin);
    s->trackingID[strcspn(s->trackingID, "\n")] = '\0'; /* strip newline */

    /* Check for duplicate Tracking ID */
    for (int i = 0; i < totalShipments; i++) {
        if (strcmp(shipments[i].trackingID, s->trackingID) == 0) {
            printf("\n  [!] A shipment with Tracking ID '%s' already exists.\n",
                   s->trackingID);
            return;
        }
    }

    printf("  Supplier Name     : ");
    fgets(s->supplierName, NAME_LEN, stdin);
    s->supplierName[strcspn(s->supplierName, "\n")] = '\0';

    printf("  Item Description  : ");
    fgets(s->itemDescription, DESC_LEN, stdin);
    s->itemDescription[strcspn(s->itemDescription, "\n")] = '\0';

    printf("  Weight (kg)       : ");
    scanf("%f", &s->weightKg);
    getchar();

    /* Shipping mode selection */
    printf("  Shipping Mode     : 1=Air  2=Sea  > ");
    scanf("%d", &s->shippingMode);
    getchar();
    if (s->shippingMode != 1 && s->shippingMode != 2) {
        printf("\n  [!] Invalid mode. Defaulting to Sea.\n");
        s->shippingMode = 2;
    }

    /* Initial status */
    printf("  Shipment Status   : 1=In Transit  2=At Customs  3=Arrived  > ");
    scanf("%d", &s->status);
    getchar();
    if (s->status < 1 || s->status > 3) {
        printf("\n  [!] Invalid status. Defaulting to In Transit.\n");
        s->status = 1;
    }

    /* Auto-calculate costs based on weight and mode */
    s->shippingCost    = computeShippingCost(s->weightKg, s->shippingMode);
    s->uraFees         = s->shippingCost * URA_FEE_RATE;
    s->handlingCharges = s->shippingCost * HANDLING_FEE_RATE;

    totalShipments++;
    saveToFile(); /* Persist immediately after each addition */

    printf("\n  [✓] Shipment '%s' added successfully!\n", s->trackingID);
    printf("  Calculated Shipping Cost : UGX %.2f\n", s->shippingCost);
    printf("  URA Clearing Fees        : UGX %.2f\n", s->uraFees);
    printf("  Handling Charges         : UGX %.2f\n", s->handlingCharges);
    printf("  TOTAL COST               : UGX %.2f\n",
           s->shippingCost + s->uraFees + s->handlingCharges);
}

/* ============================================================
 *  FUNCTION 2 – Update shipment status by Tracking ID
 * ============================================================ */
void updateStatus(void) {
    char  searchID[TRACKING_ID_LEN];
    int   found = 0;

    printf("\n  ── UPDATE SHIPMENT STATUS ───────────────────────\n");
    printf("  Enter Tracking ID : ");
    fgets(searchID, TRACKING_ID_LEN, stdin);
    searchID[strcspn(searchID, "\n")] = '\0';

    for (int i = 0; i < totalShipments; i++) {
        if (strcmp(shipments[i].trackingID, searchID) == 0) {
            found = 1;
            printf("\n  Current Status: %s\n", statusName(shipments[i].status));
            printf("  New Status  : 1=In Transit  2=At Customs  3=Arrived  > ");
            scanf("%d", &shipments[i].status);
            getchar();

            if (shipments[i].status < 1 || shipments[i].status > 3) {
                printf("\n  [!] Invalid status entered. No changes made.\n");
                shipments[i].status = 1;
                return;
            }

            saveToFile();
            printf("\n  [✓] Status updated to: %s\n",
                   statusName(shipments[i].status));
            break;
        }
    }

    if (!found) {
        printf("\n  [!] No shipment found with Tracking ID '%s'.\n", searchID);
    }
}

/* ============================================================
 *  FUNCTION 3 – Search for a shipment by Tracking ID
 * ============================================================ */
void searchShipment(void) {
    char searchID[TRACKING_ID_LEN];
    int  found = 0;

    printf("\n  ── SEARCH SHIPMENT ──────────────────────────────\n");
    printf("  Enter Tracking ID : ");
    fgets(searchID, TRACKING_ID_LEN, stdin);
    searchID[strcspn(searchID, "\n")] = '\0';

    for (int i = 0; i < totalShipments; i++) {
        if (strcmp(shipments[i].trackingID, searchID) == 0) {
            found = 1;
            printf("\n  Shipment Found:\n");
            printShipment(&shipments[i]);
            break;
        }
    }

    if (!found) {
        printf("\n  [!] No shipment found with Tracking ID '%s'.\n", searchID);
    }
}

/* ============================================================
 *  FUNCTION 4 – Calculate and display costs for a shipment
 * ============================================================ */
void calculateCosts(void) {
    char  searchID[TRACKING_ID_LEN];
    int   found = 0;

    printf("\n  ── CALCULATE SHIPPING COSTS ─────────────────────\n");
    printf("  Enter Tracking ID : ");
    fgets(searchID, TRACKING_ID_LEN, stdin);
    searchID[strcspn(searchID, "\n")] = '\0';

    for (int i = 0; i < totalShipments; i++) {
        if (strcmp(shipments[i].trackingID, searchID) == 0) {
            found = 1;
            Shipment *s = &shipments[i];

            /* Recalculate to ensure values are current */
            s->shippingCost    = computeShippingCost(s->weightKg, s->shippingMode);
            s->uraFees         = s->shippingCost * URA_FEE_RATE;
            s->handlingCharges = s->shippingCost * HANDLING_FEE_RATE;

            double totalCost = s->shippingCost + s->uraFees + s->handlingCharges;

            printDivider();
            printf("  SHIPPING COST BREAKDOWN\n");
            printDivider();
            printf("  Tracking ID       : %s\n",   s->trackingID);
            printf("  Item              : %s\n",   s->itemDescription);
            printf("  Weight            : %.2f kg\n", s->weightKg);
            printf("  Shipping Mode     : %s\n",   modeName(s->shippingMode));
            printDivider();
            printf("  Freight Rate      : UGX %.2f / kg\n",
                   (s->shippingMode == 1) ? AIR_RATE_PER_KG : SEA_RATE_PER_KG);
            printf("  Shipping Cost     : UGX %.2f\n", s->shippingCost);
            printf("  URA Clearing Fees : UGX %.2f  (%.0f%% of freight)\n",
                   s->uraFees, URA_FEE_RATE * 100);
            printf("  Handling Charges  : UGX %.2f  (%.0f%% of freight)\n",
                   s->handlingCharges, HANDLING_FEE_RATE * 100);
            printDivider();
            printf("  TOTAL COST        : UGX %.2f\n", totalCost);
            printDivider();

            saveToFile();
            break;
        }
    }

    if (!found) {
        printf("\n  [!] No shipment found with Tracking ID '%s'.\n", searchID);
    }
}

/* ============================================================
 *  FUNCTION 5 – Display all shipment records
 * ============================================================ */
void displayAll(void) {
    printf("\n  ── ALL SHIPMENT RECORDS ─────────────────────────\n");

    if (totalShipments == 0) {
        printf("  No shipment records found.\n");
        return;
    }

    printf("  Total Records: %d\n", totalShipments);

    for (int i = 0; i < totalShipments; i++) {
        printf("\n  Record #%d\n", i + 1);
        printShipment(&shipments[i]);
    }
}

/* ============================================================
 *  HELPER – Print a single shipment's full details
 * ============================================================ */
void printShipment(const Shipment *s) {
    double totalCost = s->shippingCost + s->uraFees + s->handlingCharges;

    printDivider();
    printf("  Tracking ID       : %s\n",      s->trackingID);
    printf("  Supplier Name     : %s\n",      s->supplierName);
    printf("  Item Description  : %s\n",      s->itemDescription);
    printf("  Weight            : %.2f kg\n", s->weightKg);
    printf("  Shipping Mode     : %s\n",      modeName(s->shippingMode));
    printf("  Status            : %s\n",      statusName(s->status));
    printf("  Shipping Cost     : UGX %.2f\n", s->shippingCost);
    printf("  URA Clearing Fees : UGX %.2f\n", s->uraFees);
    printf("  Handling Charges  : UGX %.2f\n", s->handlingCharges);
    printf("  TOTAL COST        : UGX %.2f\n", totalCost);
    printDivider();
}

/* ============================================================
 *  HELPER – Print a visual divider line
 * ============================================================ */
void printDivider(void) {
    printf("  ─────────────────────────────────────────────────\n");
}

/* ============================================================
 *  HELPER – Return human-readable shipping mode string
 * ============================================================ */
const char *modeName(int mode) {
    switch (mode) {
        case 1:  return "Air Freight";
        case 2:  return "Sea Freight";
        default: return "Unknown";
    }
}

/* ============================================================
 *  HELPER – Return human-readable status string
 * ============================================================ */
const char *statusName(int status) {
    switch (status) {
        case 1:  return "In Transit";
        case 2:  return "At Customs";
        case 3:  return "Arrived";
        default: return "Unknown";
    }
}

/* ============================================================
 *  COST CALCULATION FUNCTION
 *  Formula:
 *    Shipping Cost  = weight (kg) × rate per kg
 *    URA Fees       = Shipping Cost × 6%
 *    Handling Fees  = Shipping Cost × 3%
 * ============================================================ */
double computeShippingCost(float weightKg, int mode) {
    double ratePerKg = (mode == 1) ? AIR_RATE_PER_KG : SEA_RATE_PER_KG;
    return (double)weightKg * ratePerKg;
}
