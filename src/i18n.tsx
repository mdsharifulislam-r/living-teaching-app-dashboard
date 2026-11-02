import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Language = "en" | "fr";

const translations: Record<string, string> = {
  "Admin sign in": "Connexion administrateur",
  "Sign in with your admin account to open the dashboard.": "Connectez-vous avec votre compte administrateur pour accéder au tableau de bord.",
  "Email address": "Adresse e-mail",
  Password: "Mot de passe",
  "Enter your password": "Saisissez votre mot de passe",
  "Hide password": "Masquer le mot de passe",
  "Show password": "Afficher le mot de passe",
  "Signing in…": "Connexion en cours…",
  "Sign in": "Se connecter",
  "The login response did not include an access token. Please contact your administrator.": "La réponse de connexion ne contient pas de jeton d’accès. Veuillez contacter votre administrateur.",
  "Login succeeded, but no admin profile or role was returned. Ask the backend administrator to include admin details in the login response or token.": "La connexion a réussi, mais aucun profil ni rôle administrateur n’a été renvoyé. Demandez à l’administrateur du serveur d’inclure les informations de l’administrateur dans la réponse ou le jeton.",
  "Sign in failed. Check your email and password, then try again.": "Échec de la connexion. Vérifiez votre adresse e-mail et votre mot de passe, puis réessayez.",
  "Please try again later.": "Veuillez réessayer plus tard.",
  "Admin Panel": "Panneau d’administration",
  Dashboard: "Tableau de bord",
  Prayers: "Prières",
  Prayer: "Prière",
  Audio: "Audio",
  Encouragements: "Encouragements",
  encouragements: "encouragements",
  Encouragement: "Encouragement",
  encouragement: "encouragement",
  Teachings: "Enseignements",
  teachings: "enseignements",
  Teaching: "Enseignement",
  teaching: "enseignement",
  Verses: "Versets",
  verses: "versets",
  Verse: "Verset",
  verse: "verset",
  Images: "Images",
  images: "images",
  Image: "Image",
  image: "image",
  prayers: "prières",
  prayer: "prière",
  "social links": "liens sociaux",
  "social link": "lien social",
  "Social Links": "Liens sociaux",
  "Social link": "Lien social",
  "Social links": "Liens sociaux",
  "Push Notifications": "Notifications push",
  "Push notifications": "Notifications push",
  Notifications: "Notifications",
  Users: "Utilisateurs",
  Comments: "Commentaires",
  "Team & Roles": "Équipe et rôles",
  "My Profile": "Mon profil",
  "Super Admin": "Super administrateur",
  Admin: "Administrateur",
  Editor: "Éditeur",
  Moderator: "Modérateur",
  "Edit profile": "Modifier le profil",
  "Account menu": "Menu du compte",
  "Log out": "Se déconnecter",
  "Switch account · demo": "Changer de compte · démo",
  "Try each role to see what it can access. Real sign-in comes with the backend.": "Essayez chaque rôle pour voir à quoi il donne accès. La connexion réelle sera disponible avec le serveur.",
  "Your permissions don't include that section": "Vos autorisations ne donnent pas accès à cette section",
  "Loading admin permissions…": "Chargement des autorisations administrateur…",
  "Could not verify admin permissions": "Impossible de vérifier les autorisations administrateur",
  "Back to login": "Retour à la connexion",
  "Planned for Phase 2": "Prévu pour la phase 2",
  Phase: "Phase",
  "Welcome back,": "Bon retour,",
  "Team member since": "Membre de l’équipe depuis",
  "Here's a quick look at what's in the Living Teaching app today. ": "Voici un aperçu du contenu actuel de l’application Living Teaching. ",
  "Total Users": "Nombre total d’utilisateurs",
  "Total Prayers": "Nombre total de prières",
  "Total Audio": "Nombre total d’audios",
  "Total Teachings": "Nombre total d’enseignements",
  "Total Images": "Nombre total d’images",
  "Add a prayer": "Ajouter une prière",
  "Upload audio": "Importer un audio",
  "Post an encouragement": "Publier un encouragement",
  "Add a teaching": "Ajouter un enseignement",
  "Add a verse": "Ajouter un verset",
  "Upload an image": "Importer une image",
  "Send a push notification": "Envoyer une notification push",
  "Some live dashboard totals could not be loaded. Check your connection and permissions.": "Certains totaux du tableau de bord n’ont pas pu être chargés. Vérifiez votre connexion et vos autorisations.",
  "Quick actions": "Actions rapides",
  "Needs your attention": "À traiter",
  "Drafts waiting to be published": "Brouillons en attente de publication",
  "Scheduled to go live": "Publications programmées",
  "Suspended accounts": "Comptes suspendus",
  "Updating the app is easy": "Mettre à jour l’application est simple",
  "Choose a section on the left.": "Choisissez une rubrique à gauche.",
  "Press “Add new” and fill in the form.": "Cliquez sur « Ajouter » et remplissez le formulaire.",
  "Upload a photo or audio file.": "Importez une photo ou un fichier audio.",
  "Publish now — or pick a date to schedule.": "Publiez maintenant ou choisissez une date de programmation.",
  "Content is loaded from and saved to the backend.": "Le contenu est chargé depuis le serveur et y est enregistré.",
  Published: "Publié",
  Draft: "Brouillon",
  Scheduled: "Programmé",
  "Delete this item?": "Supprimer cet élément ?",
  "will be removed from the app permanently. If you only want to hide it for now, use": "sera définitivement supprimé de l’application. Pour le masquer temporairement, utilisez",
  Unpublish: "Dépublier",
  "Keep it": "Conserver",
  "Yes, delete": "Oui, supprimer",
  Close: "Fermer",
  "No image": "Aucune image",
  "That file couldn't be read. Please choose a JPG or PNG photo.": "Impossible de lire ce fichier. Choisissez une image JPG ou PNG.",
  "Preparing…": "Préparation…",
  "Replace image": "Remplacer l’image",
  "Upload image": "Importer une image",
  "Choose from library": "Choisir dans la galerie",
  Remove: "Supprimer",
  "…or paste an image link (https://…)": "…ou collez un lien vers une image (https://…)",
  "Tap a photo from the app's image library": "Touchez une photo dans la galerie de l’application",
  "Loading images…": "Chargement des images…",
  "Could not load the image library. Try again after checking your connection.": "Impossible de charger la galerie. Vérifiez votre connexion puis réessayez.",
  "Gallery image": "Image de la galerie",
  "Change photo": "Changer la photo",
  "Remove photo": "Supprimer la photo",
  "That photo couldn't be read — try a JPG or PNG": "Impossible de lire cette photo — essayez un fichier JPG ou PNG",
  "Replace photo": "Remplacer la photo",
  "Upload photo": "Importer une photo",
  "Team member since ": "Membre de l’équipe depuis ",
  "Personal information": "Informations personnelles",
  "Full name": "Nom complet",
  "Job title": "Intitulé du poste",
  "Shown to your team, e.g. Content Editor": "Visible par votre équipe, par exemple : éditeur de contenu",
  "e.g. Content Editor": "ex. : éditeur de contenu",
  "e.g. Grace Thompson": "ex. : Grace Thompson",
  "e.g. Kenya": "ex. : Kenya",
  "Phone (optional)": "Téléphone (facultatif)",
  "About you (optional)": "À propos de vous (facultatif)",
  "A short line about your role in the ministry.": "Une brève description de votre rôle dans le ministère.",
  "Discard changes": "Annuler les modifications",
  "Profile updated": "Profil mis à jour",
  "Please enter your name": "Veuillez saisir votre nom",
  "Please enter a valid email": "Veuillez saisir une adresse e-mail valide",
  "Another team member already uses this email": "Cette adresse e-mail est déjà utilisée par un autre membre de l’équipe",
  "Review user comments, check the conversation thread, and reply from the admin dashboard.": "Consultez les commentaires des utilisateurs, lisez les discussions et répondez depuis le tableau de bord.",
  "Select a post to review comments": "Sélectionnez une publication pour consulter les commentaires",
  "Loading posts…": "Chargement des publications…",
  "Search comments or users": "Rechercher des commentaires ou des utilisateurs",
  All: "Tout",
  Pending: "En attente",
  Approved: "Approuvé",
  Rejected: "Rejeté",
  Hidden: "Masqué",
  "No posts could be loaded. Comments are retrieved by post, so check that your account can access the content endpoints.": "Impossible de charger les publications. Les commentaires étant associés à chaque publication, vérifiez que votre compte peut accéder aux contenus.",
  "Some post types could not be loaded, so their comments may not appear in the selection.": "Certains types de publications n’ont pas pu être chargés ; leurs commentaires peuvent être absents de la liste.",
  "Showing comments for": "Commentaires pour",
  "Select a post above to load its comments.": "Sélectionnez une publication ci-dessus pour charger ses commentaires.",
  "Loading comments…": "Chargement des commentaires…",
  "Unable to send reply.": "Impossible d’envoyer la réponse.",
  "Write a message with a photo and send it to everyone, or schedule it for later. You can edit the text and replace the image at any time.": "Rédigez un message avec une photo et envoyez-le à tous, ou programmez-le. Vous pouvez modifier le texte et remplacer l’image à tout moment.",
  "New notification": "Nouvelle notification",
  "Notifications go to all": "Les notifications sont envoyées à tous les",
  "active members who have notifications turned on.": "membres actifs ayant activé les notifications.",
  "The live active-member count could not be loaded.": "Impossible de charger le nombre actuel de membres actifs.",
  "Search notifications": "Rechercher des notifications",
  Sent: "Envoyé",
  "Notifications could not be loaded": "Impossible de charger les notifications",
  "Check your connection and admin access, then try again.": "Vérifiez votre connexion et vos autorisations administrateur, puis réessayez.",
  "Loading notifications…": "Chargement des notifications…",
  "No notifications here": "Aucune notification",
  "Press “New notification” to write your first one.": "Cliquez sur « Nouvelle notification » pour rédiger votre premier message.",
  "Notification title": "Titre de la notification",
  "Your message will appear here.": "Votre message apparaîtra ici.",
  "Preview on a phone": "Aperçu sur un téléphone",
  "Manage Bible verses, their publishing status, and which dates they are assigned to. Multiple verses may share a date.": "Gérez les versets bibliques, leur statut de publication et leurs dates d’affichage. Plusieurs versets peuvent partager la même date.",
  "Add new verse": "Ajouter un verset",
  "set a Verse of the Day, but cannot add, edit, or delete verses.": "définir le verset du jour, mais ne pouvez pas ajouter, modifier ou supprimer des versets.",
  "view verses, but cannot add, edit, or delete them.": "consulter les versets, mais ne pouvez pas les ajouter, les modifier ni les supprimer.",
  "Search verses": "Rechercher des versets",
  "Search verses or references": "Rechercher des versets ou des références",
  "Filter by status": "Filtrer par statut",
  "Verses could not be loaded": "Impossible de charger les versets",
  "Loading verses…": "Chargement des versets…",
  "No matching verses": "Aucun verset correspondant",
  "No verses yet": "Aucun verset pour le moment",
  "Add a verse to start building your collection.": "Ajoutez un verset pour commencer votre collection.",
  "No verses have been added yet.": "Aucun verset n’a encore été ajouté.",
  Retry: "Réessayer",
  Previous: "Précédent",
  Next: "Suivant",
  "Not set": "Non défini",
  "Manage admin accounts and choose which dashboard sections each admin can access. Super admins have access to everything.": "Gérez les comptes administrateur et choisissez les rubriques accessibles à chacun. Les super administrateurs ont accès à tout.",
  "Add admin": "Ajouter un administrateur",
  "Search admins by name, email or role": "Rechercher des administrateurs par nom, e-mail ou rôle",
  "Search admins": "Rechercher des administrateurs",
  "Admins could not be loaded": "Impossible de charger les administrateurs",
  "Loading admins…": "Chargement des administrateurs…",
  "No admins match your search.": "Aucun administrateur ne correspond à votre recherche.",
  "Admin created successfully": "Administrateur créé",
  "Admin updated successfully": "Administrateur mis à jour",
  "Admin deleted successfully": "Administrateur supprimé",
  "Could not save admin": "Impossible d’enregistrer l’administrateur",
  "Could not delete admin": "Impossible de supprimer l’administrateur",
  "Admin ID is missing": "L’identifiant de l’administrateur est manquant",
  "Registered members": "Membres inscrits",
  "New this week": "Nouveaux cette semaine",
  "New in 30 days": "Nouveaux sur 30 jours",
  "Growth (30 days)": "Croissance (30 jours)",
  active: "actif",
  suspended: "suspendu",
  "Registrations in the last 7 days": "Inscriptions au cours des 7 derniers jours",
  "Registrations in the last 30 days": "Inscriptions au cours des 30 derniers jours",
  "Compared with previous 30 days": "Par rapport aux 30 jours précédents",
  "Could not load user statistics from the backend. Confirm the admin token or API is reachable.": "Impossible de charger les statistiques des utilisateurs. Vérifiez le jeton administrateur ou l’accès à l’API.",
  "User growth": "Croissance des utilisateurs",
  growth: "de croissance",
  "Chart period": "Période du graphique",
  members: "membres",
  new: "nouveaux",
  "Move over the chart to see the numbers for each": "Survolez le graphique pour afficher les chiffres par",
  "Total members": "Nombre total de membres",
  "Loading registration data…": "Chargement des données d’inscription…",
  "No registration data is available for this period.": "Aucune donnée d’inscription n’est disponible pour cette période.",
  "New registrations per": "Nouvelles inscriptions par",
  "Registration highlights": "Aperçu des inscriptions",
  "Active members": "Membres actifs",
  "Suspended members": "Membres suspendus",
  "Peak registrations": "Pic d’inscriptions",
  "sign-ups": "inscriptions",
  "See every member and joining date": "Voir tous les membres et leur date d’inscription",
  "Registrations by": "Inscriptions par",
  Period: "Période",
  New: "Nouveaux",
  Total: "Total",
  "No data for this period.": "Aucune donnée pour cette période.",
  "Add a member": "Ajouter un membre",
  "Showing": "Affichage de",
  "on this page": "sur cette page",
  "total members": "membres au total",
  "Members could not be loaded": "Impossible de charger les membres",
  "Loading members…": "Chargement des membres…",
  Name: "Nom",
  Email: "E-mail",
  Country: "Pays",
  Registered: "Inscription",
  Status: "Statut",
  Actions: "Actions",
  "No members found.": "Aucun membre trouvé.",
  "No members on this page match your filters.": "Aucun membre de cette page ne correspond à vos filtres.",
  Active: "Actif",
  Suspended: "Suspendu",
  "Account suspended": "Compte suspendu",
  "Account re-activated": "Compte réactivé",
  "Failed to update account status": "Impossible de mettre à jour le statut du compte",
  "Member details": "Détails du membre",
  "Member for": "Membre depuis",
  "Joined today": "Inscrit aujourd’hui",
  "Member ID": "Identifiant du membre",
  "Member added — statistics updated": "Membre ajouté — statistiques mises à jour",
  "Failed to add member": "Impossible d’ajouter le membre",
  "Please enter a name": "Veuillez saisir un nom",
  "This email is already registered": "Cette adresse e-mail est déjà inscrite",
  "7 days": "7 jours",
  "30 days": "30 jours",
  "3 months": "3 mois",
  "12 months": "12 mois",
  "the last 7 days": "les 7 derniers jours",
  "the last 30 days": "les 30 derniers jours",
  "the last 3 months": "les 3 derniers mois",
  "the last 12 months": "les 12 derniers mois",
  "Yesterday": "Hier",
  "Full access": "Accès complet",
  "Creates content": "Crée du contenu",
  "Looks after the community": "Gère la communauté",
  "Full control: content, notifications, members and the team itself.": "Contrôle complet : contenu, notifications, membres et équipe.",
  "Writes and manages prayers, audio, teachings, images and push notifications.": "Rédige et gère les prières, les audios, les enseignements, les images et les notifications push.",
  "Views members and statistics, suspends accounts, and can unpublish content.": "Consulte les membres et les statistiques, suspend les comptes et peut dépublier du contenu.",
  "View the dashboard and all content": "Consulter le tableau de bord et tout le contenu",
  "Add, edit and delete content": "Ajouter, modifier et supprimer du contenu",
  "Publish or unpublish content": "Publier ou dépublier du contenu",
  "Send push notifications": "Envoyer des notifications push",
  "See user statistics and the member list": "Consulter les statistiques et la liste des membres",
  "Add, suspend or reactivate members": "Ajouter, suspendre ou réactiver des membres",
  "Add and manage users": "Ajouter et gérer les utilisateurs",
  "Update user accounts": "Mettre à jour les comptes utilisateurs",
  "Delete user accounts": "Supprimer des comptes utilisateurs",
  "Create and edit content": "Créer et modifier du contenu",
  "Publish content": "Publier du contenu",
  "Create admins": "Créer des administrateurs",
  "Update admins": "Mettre à jour les administrateurs",
  "Delete admins": "Supprimer des administrateurs",
  "Delete member accounts": "Supprimer des comptes membres",
  "Manage the team and roles": "Gérer l’équipe et les rôles",
  "Your role & permissions": "Votre rôle et vos autorisations",
  "Super admins can access every dashboard section.": "Les super administrateurs ont accès à toutes les rubriques du tableau de bord.",
  "Access is based on permissions assigned to your admin account.": "L’accès dépend des autorisations attribuées à votre compte administrateur.",
  "Your role is set by an Admin. To request different access, ask your ministry administrator.": "Votre rôle est défini par un administrateur. Pour demander un autre accès, contactez l’administrateur du ministère.",
  "Save changes": "Enregistrer les modifications",
  "Choose a strong password you don't use anywhere else.": "Choisissez un mot de passe robuste que vous n’utilisez nulle part ailleurs.",
  "Current password": "Mot de passe actuel",
  "New password": "Nouveau mot de passe",
  "Confirm new password": "Confirmer le nouveau mot de passe",
  Weak: "Faible",
  Fair: "Moyen",
  Good: "Bon",
  Strong: "Fort",
  Hide: "Masquer",
  Show: "Afficher",
  "Hide passwords": "Masquer les mots de passe",
  "Show passwords": "Afficher les mots de passe",
  "Update password": "Mettre à jour le mot de passe",
  "Please enter your current password": "Veuillez saisir votre mot de passe actuel",
  "Use at least 8 characters": "Utilisez au moins 8 caractères",
  "Passwords do not match": "Les mots de passe ne correspondent pas",
  "Password changed": "Mot de passe modifié",
  "Nothing here yet": "Rien pour le moment",
  "Nothing has been added yet.": "Aucun élément n’a encore été ajouté.",
  "Please add an image": "Veuillez ajouter une image",
  "This field is needed": "Ce champ est obligatoire",
  "When should it appear in the app?": "Quand cet élément doit-il apparaître dans l’application ?",
  "Publish now": "Publier maintenant",
  "Save as draft": "Enregistrer comme brouillon",
  Schedule: "Programmer",
  "Go live on": "Date de publication",
  "Go live at": "Heure de publication",
  Cancel: "Annuler",
  "Uploading audio…": "Importation de l’audio…",
  "Saving…": "Enregistrement…",
  "Save & publish": "Enregistrer et publier",
  "Save & schedule": "Enregistrer et programmer",
  "Save draft": "Enregistrer le brouillon",
  "Audio preview": "Aperçu audio",
  "Your browser does not support audio playback.": "Votre navigateur ne prend pas en charge la lecture audio.",
  Details: "Détails",
  Publish: "Publier",
  Edit: "Modifier",
  Delete: "Supprimer",
  Description: "Description",
  Category: "Catégorie",
  Caption: "Légende",
  Link: "Lien",
  "Content updated": "Contenu mis à jour",
  "Content created": "Contenu créé",
  Deleted: "Supprimé",
  "Could not update content": "Impossible de mettre à jour le contenu",
  "Could not create content": "Impossible de créer le contenu",
  "Could not delete content": "Impossible de supprimer le contenu",
  "Could not update publishing status": "Impossible de mettre à jour le statut de publication",
  "Unpublished — hidden from the app": "Dépublié — masqué dans l’application",
  "Published — now live in the app": "Publié — disponible dans l’application",
  "As a": "En tant que",
  "publish or unpublish content, but not add, edit or delete it.": "publier ou dépublier du contenu, mais pas l’ajouter, le modifier ni le supprimer.",
  "view this content.": "consulter ce contenu.",
  "could not be loaded": "impossible à charger",
  "Added": "Ajouté",
  "Admin account": "Compte administrateur",
  You: "Vous",
  Inactive: "Inactif",
  Permissions: "Autorisations",
  Subrole: "Sous-rôle",
  "Admin permissions": "Autorisations administrateur",
  "Sidebar sections are shown only when the admin has the matching permission.": "Les rubriques de la barre latérale apparaissent uniquement si l’administrateur possède l’autorisation correspondante.",
  "Enter the admin's name.": "Saisissez le nom de l’administrateur.",
  "Enter a valid email address.": "Saisissez une adresse e-mail valide.",
  "This email is already registered.": "Cette adresse e-mail est déjà inscrite.",
  "Use a password with at least 8 characters.": "Utilisez un mot de passe d’au moins 8 caractères.",
  "Select at least one permission.": "Sélectionnez au moins une autorisation.",
  "Add member": "Ajouter un membre",
  "Export": "Exporter",
  "Search by name, email or country": "Rechercher par nom, e-mail ou pays",
  "Search members": "Rechercher des membres",
  "registered members. See how the community is growing and manage accounts.": "membres inscrits. Suivez la croissance de la communauté et gérez les comptes.",
  Statistics: "Statistiques",
  "All members": "Tous les membres",
  "Country (optional)": "Pays (facultatif)",
  "The registration date is set to today and counts toward the growth statistics.": "La date d’inscription est définie à aujourd’hui et sera incluse dans les statistiques de croissance.",
  "Exported": "Exporté",
  "Edit admin": "Modifier l’administrateur",
  "Create admin": "Créer un administrateur",
  "Add new": "Ajouter",
  "Reply": "Répondre",
  "Send reply": "Envoyer la réponse",
  "No comments yet": "Aucun commentaire pour le moment",
  "No matching comments": "Aucun commentaire correspondant",
  "Unable to load comments for this post.": "Impossible de charger les commentaires de cette publication.",
  "No comments found": "Aucun commentaire trouvé",
  "There are no user comments matching the current filter.": "Aucun commentaire d’utilisateur ne correspond au filtre actuel.",
  "Unknown user": "Utilisateur inconnu",
  "No email": "Aucune adresse e-mail",
  "General feedback": "Commentaire général",
  "No comment text available.": "Aucun texte de commentaire disponible.",
  "No date": "Aucune date",
  "Admin reply": "Réponse de l’administrateur",
  "Write a reply to the user": "Écrivez une réponse à l’utilisateur",
  "Failed to resend notification": "Impossible de renvoyer la notification",
  "Failed to send notification": "Impossible d’envoyer la notification",
  "Failed to mark notification as read": "Impossible de marquer la notification comme lue",
  "Marked as read": "Marquée comme lue",
  Resend: "Renvoyer",
  "Send now": "Envoyer maintenant",
  "Schedule notification": "Programmer la notification",
  "Keep as sent": "Conserver comme envoyée",
  Reschedule: "Reprogrammer",
  "New push notification": "Nouvelle notification push",
  "Edit push notification": "Modifier la notification push",
  Message: "Message",
  "e.g. New Teaching Available": "ex. : nouvel enseignement disponible",
  "Keep it short, warm and encouraging.": "Rédigez un message bref, chaleureux et encourageant.",
  "Notification image (optional)": "Image de la notification (facultatif)",
  "Wide photos (like 16:9) look best. You can replace or remove the image at any time.": "Les photos panoramiques (format 16:9, par exemple) sont idéales. Vous pouvez remplacer ou supprimer l’image à tout moment.",
  "When someone taps it, open…": "À l’ouverture de la notification, afficher…",
  "Also sets the icon shown in the app's Notifications list.": "Définit également l’icône affichée dans la liste des notifications de l’application.",
  Delivery: "Envoi",
  "Send on": "Envoyer le",
  "This was already delivered. Saving updates the copy in the app's inbox. To alert members again, use": "Cette notification a déjà été envoyée. L’enregistrement met à jour son texte dans la boîte de réception de l’application. Pour alerter à nouveau les membres, utilisez",
  "Live preview": "Aperçu en direct",
  "Send a test to this device": "Envoyer un test sur cet appareil",
  "Please add a title": "Veuillez ajouter un titre",
  "Please write a message": "Veuillez rédiger un message",
  "Please choose a time in the future": "Veuillez choisir une date ultérieure",
  "Add a title or message to test": "Ajoutez un titre ou un message pour effectuer le test",
  "Test notification sent to this device": "Notification de test envoyée sur cet appareil",
  "Changes saved — notification resent": "Modifications enregistrées — notification renvoyée",
  "Scheduled successfully": "Programmée avec succès",
  "Failed to save notification": "Impossible d’enregistrer la notification",
  "Verse of the Day": "Verset du jour",
  "Not Verse of the Day": "Pas le verset du jour",
  "Set day": "Définir le jour",
  "Set as Verse of the Day": "Définir comme verset du jour",
  "This verse cannot be deleted because it has no ID": "Ce verset ne peut pas être supprimé car son identifiant est manquant",
  "This verse cannot be assigned because it has no ID": "Ce verset ne peut pas être attribué car son identifiant est manquant",
  "Verse deleted": "Verset supprimé",
  "Verse of the Day updated": "Verset du jour mis à jour",
  "Failed to delete verse": "Impossible de supprimer le verset",
  "Failed to set Verse of the Day": "Impossible de définir le verset du jour",
  "Please enter the verse text": "Veuillez saisir le texte du verset",
  "Please enter the Bible reference": "Veuillez saisir la référence biblique",
  "Choose a scheduled date": "Choisissez une date de programmation",
  "Choose a scheduled time": "Choisissez une heure de programmation",
  "Scheduled date": "Date de programmation",
  "Scheduled time": "Heure de programmation",
  "Verse of the Day date": "Date du verset du jour",
  Yes: "Oui",
  No: "Non",
  "This state is read-only here. Use “Set day” on a verse to assign a date.": "Ce statut est en lecture seule. Utilisez « Définir le jour » sur un verset pour lui attribuer une date.",
  "Choose a date": "Choisissez une date",
  "Other verses already assigned to this date will remain assigned.": "Les autres versets déjà attribués à cette date le resteront.",
  "Set date": "Définir la date",
  "No audio selected": "Aucun fichier audio sélectionné",
  "Uploading file in chunks…": "Importation du fichier par segments…",
  "The selected image could not be read": "Impossible de lire l’image sélectionnée",
  "Audio upload failed.": "Échec de l’importation audio.",
  "Add a new": "Ajouter un nouveau",
  "Search by name": "Rechercher par nom",
  "invited": "invité",
  "disabled": "désactivé",
  all: "tout",
  pending: "en attente",
  approved: "approuvé",
  rejected: "rejeté",
  hidden: "masqué",
  sent: "envoyé",
  scheduled: "programmé",
  published: "publié",
  draft: "brouillon",
  inactive: "inactif",
  "Untitled notification": "Notification sans titre",
  Announcement: "Annonce",
  "Send notifications": "Envoyer des notifications",
  "Upload": "Importer",
  "Title": "Titre",
  "Short description": "Brève description",
  "Prayer title": "Titre de la prière",
  "Prayer text": "Texte de la prière",
  "Cover image": "Image de couverture",
  "Prayer audio (optional)": "Audio de la prière (facultatif)",
  "Audio is uploaded to the server in chunks.": "L’audio est envoyé au serveur par segments.",
  "Written and audio prayers shown in the Prayers tab.": "Prières écrites et audio affichées dans l’onglet Prières.",
  "Worship, sermons and spiritual messages.": "Louanges, sermons et messages spirituels.",
  "Artwork": "Illustration",
  "Full teaching": "Enseignement complet",
  "Teaching audio (optional)": "Audio de l’enseignement (facultatif)",
  "Short, uplifting words with a beautiful photo.": "Des mots brefs et inspirants accompagnés d’une belle photo.",
  "Keep it short and encouraging": "Restez bref et encourageant",
  Author: "Auteur",
  Date: "Date",
  Photo: "Photo",
  "Manage teaching messages, audio, and publishing status.": "Gérez les enseignements, les fichiers audio et leur statut de publication.",
  "The verse shown on Home. The latest verse dated today or earlier is displayed.": "Le verset affiché sur l’accueil. Le dernier verset daté d’aujourd’hui ou d’une date antérieure est affiché.",
  "Verse text": "Texte du verset",
  Reference: "Référence",
  "Show on date": "Afficher à la date du",
  "Pick a future date to schedule the verse.": "Choisissez une date ultérieure pour programmer le verset.",
  "Background image": "Image d’arrière-plan",
  "Tall photos work best.": "Les photos verticales sont idéales.",
  "Photos for the inspiration gallery.": "Photos de la galerie d’inspiration.",
  "Caption (optional)": "Légende (facultatif)",
  "Shown on the Profile screen of the app.": "Affiché sur l’écran de profil de l’application.",
  Network: "Réseau",
  "Display name": "Nom affiché",
  Language: "Langue",
  English: "Anglais",
  French: "Français",
};

const dynamicTranslations: [RegExp, (match: RegExpMatchArray) => string][] = [
  [/^Scheduled · (.+)$/, (m) => `Programmé · ${m[1]}`],
  [/^Sent · (.+)$/, (m) => `Envoyé · ${m[1]}`],
  [/^Page (\d+) of (\d+)$/, (m) => `Page ${m[1]} sur ${m[2]}`],
  [/^(\d+) days ago$/, (m) => `Il y a ${m[1]} jours`],
  [/^(\d+) weeks ago$/, (m) => `Il y a ${m[1]} semaines`],
  [/^(\d+) months ago$/, (m) => `Il y a ${m[1]} mois`],
  [/^(\d+) years ago$/, (m) => `Il y a ${m[1]} ans`],
  [/^View (.+)$/, (m) => `Voir ${m[1]}`],
  [/^Suspend (.+)$/, (m) => `Suspendre ${m[1]}`],
  [/^Activate (.+)$/, (m) => `Activer ${m[1]}`],
  [/^Use (.+)$/, (m) => `Utiliser ${m[1]}`],
  [/^Set (.+) as Verse of the Day$/, (m) => `Définir ${m[1]} comme verset du jour`],
  [/^Send to (\d+) members$/, (m) => `Envoyer à ${m[1]} membres`],
  [/^Sent again to (\d+) members$/, (m) => `Renvoyée à ${m[1]} membres`],
  [/^Sent to (\d+) members$/, (m) => `Envoyée à ${m[1]} membres`],
  [/^(\d+) verses? · Page (\d+) of (\d+)$/, (m) => `${m[1]} verset${m[1] === "1" ? "" : "s"} · Page ${m[2]} sur ${m[3]}`],
  [/^Search (.+)$/, (m) => `Rechercher : ${translations[m[1]]?.toLowerCase() ?? m[1]}`],
  [/^Loading (.+)…$/, (m) => `Chargement : ${translations[m[1]]?.toLowerCase() ?? m[1]}…`],
  [/^Nothing has been added yet\.$/, () => "Aucun élément n’a encore été ajouté."],
  [/^Press “Add new (.+)” to create your first one\.$/, (m) => `Cliquez sur « Ajouter ${translations[m[1]]?.toLowerCase() ?? m[1]} » pour créer le premier élément.`],
  [/^Add (.+)$/, (m) => `Ajouter ${translations[m[1]]?.toLowerCase() ?? m[1]}`],
  [/^Edit (.+)$/, (m) => `Modifier ${translations[m[1]]?.toLowerCase() ?? m[1]}`],
  [/^View image (.+)$/, (m) => `Voir l’image ${m[1]}`],
  [/^View details for (.+)$/, (m) => `Voir les détails de ${m[1]}`],
  [/^Added (.+)$/, (m) => `Ajouté le ${m[1]}`],
  [/^Exported (\d+) members$/, (m) => `${m[1]} membres exportés`],
  [/^(\d+) members$/, (m) => `${m[1]} membres`],
  [/^(\d+) (day|week|month)s? ago$/, (m) => `Il y a ${m[1]} ${m[2] === "day" ? "jour" : m[2] === "week" ? "semaine" : "mois"}${m[1] === "1" || m[2] === "month" ? "" : "s"}`],
  [/^Showing (\d+) members on this page · (\d+) total members$/, (m) => `Affichage de ${m[1]} membres sur cette page · ${m[2]} membres au total`],
];

function translate(value: string, language: Language) {
  if (language === "en") return value;
  const phrase = value.trim();
  if (translations[phrase]) {
    const leading = value.match(/^\s*/)?.[0] ?? "";
    const trailing = value.match(/\s*$/)?.[0] ?? "";
    return `${leading}${translations[phrase]}${trailing}`;
  }
  for (const [pattern, render] of dynamicTranslations) {
    const match = phrase.match(pattern);
    if (match) return render(match);
  }
  const date = phrase.match(/^([A-Z][a-z]{2}) (\d{1,2})(?:, (\d{4}))?$/);
  if (date) {
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const month = months[date[1]];
    if (month !== undefined) {
      const formatted = new Date(Date.UTC(Number(date[3] ?? new Date().getUTCFullYear()), month, Number(date[2]))).toLocaleDateString("fr-FR", {
        month: "short",
        day: "numeric",
        ...(date[3] ? { year: "numeric" } : {}),
        timeZone: "UTC",
      });
      return formatted;
    }
  }
  const monthYear = phrase.match(/^([A-Z][a-z]{2}) (\d{4})$/);
  if (monthYear) {
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const month = months[monthYear[1]];
    if (month !== undefined) {
      return new Date(Date.UTC(Number(monthYear[2]), month, 1)).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    }
  }
  return value;
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readLanguage(): Language {
  return window.localStorage.getItem("living-teaching-language") === "fr" ? "fr" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readLanguage);
  const originalText = useRef(new WeakMap<Text, string>());
  const translatedText = useRef(new WeakMap<Text, string>());
  const originalAttributes = useRef(new WeakMap<Element, Map<string, string>>());
  const translatedAttributes = useRef(new WeakMap<Element, Map<string, string>>());
  const value = useMemo(() => ({ language, setLanguage }), [language]);

  useEffect(() => {
    window.localStorage.setItem("living-teaching-language", language);
    document.documentElement.lang = language;

    const attributes = ["aria-label", "placeholder", "title", "alt"];

    const localize = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const textNode = node as Text;
        const current = textNode.nodeValue ?? "";
        const lastOutput = translatedText.current.get(textNode);
        if (lastOutput === undefined || current !== lastOutput) originalText.current.set(textNode, current);
        const source = originalText.current.get(textNode) ?? current;
        const next = translate(source, language);
        translatedText.current.set(textNode, next);
        if (current !== next) textNode.nodeValue = next;
        node = walker.nextNode();
      }

      const elements = root instanceof Element ? [root, ...root.querySelectorAll("*")] : root instanceof Document ? [root.documentElement, ...root.querySelectorAll("*")] : [];
      for (const element of elements) {
        for (const attribute of attributes) {
          if (!element.hasAttribute(attribute)) continue;
          let originals = originalAttributes.current.get(element);
          if (!originals) {
            originals = new Map();
            originalAttributes.current.set(element, originals);
          }
          let outputs = translatedAttributes.current.get(element);
          if (!outputs) {
            outputs = new Map();
            translatedAttributes.current.set(element, outputs);
          }
          const current = element.getAttribute(attribute) ?? "";
          const lastOutput = outputs.get(attribute);
          if (lastOutput === undefined || current !== lastOutput) originals.set(attribute, current);
          const next = translate(originals.get(attribute) ?? current, language);
          outputs.set(attribute, next);
          if (current !== next) element.setAttribute(attribute, next);
        }
      }
    };

    localize(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData" && record.target.parentNode) localize(record.target.parentNode);
        else if (record.type === "attributes") localize(record.target);
        else localize(record.target);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: attributes });
    return () => observer.disconnect();
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <label className="flex items-center gap-2 text-[13px] font-semibold text-mute">
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="rounded-full border border-line bg-white px-3 py-2 text-[13px] font-bold text-brand-800 outline-none focus:ring-2 focus:ring-brand-300"
      >
        <option value="en">English</option>
        <option value="fr">Français</option>
      </select>
    </label>
  );
}
