# 🎾 Padel Buddies - Εφαρμογή Προγραμματισμού Παιχνιδιών

Μια σύγχρονη web εφαρμογή για τον προγραμματισμό και την οργάνωση των εβδομαδιαίων παιχνιδιών padel της παρέας σας!

## 🚀 Χαρακτηριστικά

- **📅 Ημερολόγιο**: Προβολή όλων των προγραμματισμένων παιχνιδιών
- **➕ Κρατήσεις**: Εύκολος προγραμματισμός νέων sessions
- **🏟️ Διαχείριση Γηπέδων**: Προσθήκη και διαχείριση αγαπημένων venues
- **👥 Διαχείριση Παικτών**: Επιλογή παικτών από την ομάδα (Σόφος, Μίλλης, Μάμους, Αντρέας)
- **📱 Responsive Design**: Λειτουργεί τέλεια σε mobile και desktop
- **💾 Τοπική Αποθήκευση**: Όλα τα δεδομένα αποθηκεύονται στον browser

## 🎯 Λειτουργίες

### Ημερολόγιο
- Προβολή μηνιαίου ημερολογίου
- Οπτική ένδειξη ημερών με προγραμματισμένα παιχνίδια
- Κλικ σε μέρα για προβολή λεπτομερειών
- Λίστα επερχόμενων παιχνιδιών

### Κρατήσεις
- Επιλογή ημερομηνίας και ώρας
- Επιλογή γηπέδου από τη λίστα
- Επιλογή παικτών με checkboxes
- Προσθήκη σημειώσεων για το παιχνίδι

### Γήπεδα
- Προβολή όλων των διαθέσιμων γηπέδων
- Προσθήκη νέων γηπέδων με στοιχεία επικοινωνίας
- Αποθήκευση τιμών ανά ώρα

## 🛠️ Τεχνολογίες

- **HTML5**: Σημασιολογική δομή
- **CSS3**: Σύγχρονο styling με animations
- **Vanilla JavaScript**: Καθαρή JavaScript χωρίς dependencies
- **LocalStorage**: Τοπική αποθήκευση δεδομένων
- **Font Awesome**: Icons
- **Responsive Design**: Mobile-first approach

## 📱 Συμβατότητα

- ✅ Chrome, Firefox, Safari, Edge
- ✅ iOS & Android browsers
- ✅ Desktop & Mobile responsive

## 🚀 Deployment στο GitHub Pages

1. **Fork/Clone** το repo
2. **Ενεργοποίηση GitHub Pages**: 
   - Settings → Pages → Source: Deploy from a branch
   - Branch: main/master
3. **Πρόσβαση**: `https://yourusername.github.io/padel`

## 💡 Χρήση

1. **Προσθέστε Γήπεδα**: Πηγαίνετε στην καρτέλα "Γήπεδα" και προσθέστε τα αγαπημένα σας venues
2. **Προγραμματίστε Παιχνίδι**: Καρτέλα "Νέα Κράτηση" → Συμπληρώστε τη φόρμα
3. **Προβάλετε το Ημερολόγιο**: Δείτε όλα τα προγραμματισμένα παιχνίδια

## 🎨 Customization

Για να προσαρμόσετε την εφαρμογή:

- **Χρώματα**: Επεξεργαστείτε τις CSS μεταβλητές στο `style.css`
- **Ονόματα Παικτών**: Αλλάξτε τα ονόματα στο `index.html`
- **Γλώσσα**: Μεταφράστε τα strings στον κώδικα

## 📊 Data Structure

```javascript
{
  sessions: [
    {
      id: timestamp,
      date: "YYYY-MM-DD",
      time: "HH:MM",
      venueId: number,
      players: ["Όνομα1", "Όνομα2"],
      notes: "string",
      createdAt: "ISO string"
    }
  ],
  venues: [
    {
      id: number,
      name: "string",
      address: "string",
      phone: "string",
      pricePerHour: number
    }
  ]
}
```

## 🤝 Contributing

Καλώς ήρθαν οι προτάσεις! Ανοίξτε ένα issue ή στείλτε pull request.

## 📄 License

MIT License - χρησιμοποιήστε το ελεύθερα!

---

**Φτιαγμένο με ❤️ για την Padel Buddies παρέα!** 🎾 