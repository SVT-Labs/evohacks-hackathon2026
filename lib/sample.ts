/**
 * A hand-written example Report: a chemistry lecture on chemical equilibrium
 * bridged to football tactics, plus the same report translated into Turkish.
 *
 * It is what POST /api/generate returns when DEMO_MODE=true, and it doubles as
 * realistic fixture data for building and testing the report UI.
 */
import type { Report } from "./types";

export const SAMPLE_REPORT: Report = {
  title: "Chemical Equilibrium Through the Lens of Football Tactics",
  interest: "Football tactics",
  language: "en",
  summary:
    "This lecture explains what it means for a reversible reaction to be at equilibrium, how the equilibrium constant K and the reaction quotient Q describe and predict it, and how a system responds when it is disturbed. Each idea is bridged to football tactics: a team shape that holds while the players keep moving, the balance a game plan settles into, and the way a side shifts to absorb an overload. Wherever the football picture stops matching the chemistry, the report says so.",
  concepts: [
    {
      id: "c1",
      name: "Dynamic equilibrium",
      lecture_explanation:
        "In a closed system, a reversible reaction reaches equilibrium when the forward reaction and the reverse reaction happen at the same rate. Both reactions keep going, but because they cancel each other out, the concentrations of reactants and products stop changing. Equilibrium does not mean the amounts are equal, only that they are constant.",
      bridge_title: "The shape holds while the players keep moving",
      bridge_explanation:
        "Watch a team in settled possession: full-backs overlap, midfielders drop, wingers tuck inside. Individuals never stop moving, yet the overall shape, meaning how many players are ahead of the ball and how many are behind it, stays the same. That is what \"dynamic\" means: constant movement at the level of individuals, no net change at the level of the whole.",
      analogy:
        "Every time one player crosses the halfway line going forward, a teammate drops back across it. Players (molecules) keep switching halves (reactant ⇌ product), but the head-count in each half (the concentrations) stays fixed because the two flows are equal.",
      analogy_limits:
        "Players swap on purpose, following a plan. Molecules react through random collisions, and the equal rates emerge from statistics over roughly 10²³ particles, not from intent. A team also has only ten outfield players, so its \"concentrations\" change in whole steps, and it is not a closed system: substitutions and red cards have no counterpart in a sealed reaction vessel.",
      example:
        "Seal colourless N₂O₄ in a flask: N₂O₄(g) ⇌ 2NO₂(g). The brown colour of NO₂ deepens and then stops changing, yet isotope-labelling experiments show molecules still converting in both directions. Football version: over five minutes of settled play, 12 forward runs cross the halfway line and 12 recovery runs come back. The net change in each half is zero, even though 24 crossings took place.",
      misconception:
        "\"At equilibrium the reaction has stopped\" and \"the amounts of reactants and products are equal.\" Both are wrong. The two reactions continue at equal rates, and the mixture can be mostly reactants or mostly products.",
      strength: 5,
    },
    {
      id: "c2",
      name: "The equilibrium constant, K",
      lecture_explanation:
        "For a reaction aA + bB ⇌ cC + dD, the equilibrium constant is Kc = [C]^c [D]^d / ([A]^a [B]^b), using the concentrations at equilibrium. At a given temperature K always has the same value, whatever amounts you started with. A large K (much greater than 1) means products dominate at equilibrium; a small K (much less than 1) means reactants dominate.",
      bridge_title: "The balance a game plan settles into",
      bridge_explanation:
        "Every tactical setup has a characteristic balance between attack and defence. A high-pressing side settles with many players ahead of the ball; a low-block side settles with few. However the passage of play began, whether from a kick-off, a goal kick or a throw-in, the team drifts back to the balance its game plan dictates. K is that built-in balance for a reaction.",
      analogy:
        "K is like the ratio of attackers to defenders a team settles into under a fixed game plan. An all-out-attack plan is a large K (the product side is crowded); a park-the-bus plan is a small K. Only a new game plan (a new temperature) changes the ratio the team settles at.",
      analogy_limits:
        "K is an exact number fixed by temperature alone, and it includes the stoichiometric exponents. A team's balance is fuzzy and shifts with the scoreline, fatigue and the opponent. K also says nothing about how fast equilibrium is reached, whereas a game plan usually implies a tempo too.",
      example:
        "For H₂(g) + I₂(g) ⇌ 2HI(g), suppose the equilibrium concentrations are [H₂] = [I₂] = 0.10 M and [HI] = 0.70 M. Then Kc = (0.70)² / (0.10 × 0.10) = 49. K is well above 1, so products are favoured: the chemical equivalent of a side that settles with most of its players in the attacking half. Start from pure HI instead and, at the same temperature, the mixture still ends up satisfying K = 49, just as the team finds the same balance from any restart.",
      misconception:
        "\"K changes if you add more reactant or change the pressure.\" It does not. Those changes alter the concentrations, and the system then readjusts until the same K is satisfied again. Only a change in temperature gives a new K.",
      strength: 4,
    },
    {
      id: "c3",
      name: "The reaction quotient, Q",
      lecture_explanation:
        "The reaction quotient Q uses the same expression as K, but with the concentrations at any moment rather than at equilibrium. Comparing the two tells you which way the reaction will go. If Q < K there are too few products, so the forward reaction dominates. If Q > K there are too many products, so the reverse reaction dominates. If Q = K the system is at equilibrium.",
      bridge_title: "Reading the shape right now against the plan",
      bridge_explanation:
        "A coach glances at the pitch and compares the shape at this instant with the shape the plan calls for. Too few bodies forward? Push up. Too many caught upfield? Get back. Q is the snapshot, K is the target, and the gap between them tells you which way the next movement goes.",
      analogy:
        "Q is the attackers-to-defenders ratio at this moment; K is the ratio the game plan settles at. Q < K: the team is too deep, so players push up (forward reaction). Q > K: the team is overcommitted, so players track back (reverse reaction). Q = K: the shape is right and only like-for-like swaps continue.",
      analogy_limits:
        "A team can ignore the mismatch, because tired players may not track back, but a chemical mixture always moves toward K. Molecules also do not \"see\" a target: the net shift appears only because one direction's reaction rate is temporarily higher than the other's.",
      example:
        "With K = 49 for H₂(g) + I₂(g) ⇌ 2HI(g), a mixture contains [H₂] = [I₂] = 0.20 M and [HI] = 0.80 M. Q = (0.80)² / (0.20 × 0.20) = 16. Since 16 < 49, the forward reaction wins and more HI forms until Q rises to 49. On the pitch: the plan settles at a high attackers-to-defenders ratio, the current ratio is lower, so the team steps up until the shape matches the plan.",
      misconception:
        "\"Q and K are the same thing.\" They share a formula, but K is a single fixed value at a given temperature, while Q can take any value depending on the current mixture. They are equal only at equilibrium.",
      strength: 4,
    },
    {
      id: "c4",
      name: "Le Chatelier's principle",
      lecture_explanation:
        "If a system at equilibrium is disturbed, it shifts in the direction that partly counteracts the disturbance. Adding a reactant shifts it toward products. Increasing the pressure shifts it toward the side with fewer gas molecules. Raising the temperature shifts it in the endothermic direction. Concentration and pressure changes leave K unchanged, but a temperature change gives K a new value.",
      bridge_title: "Shifting across to absorb an overload",
      bridge_explanation:
        "When the opponent overloads one flank, a well-drilled team slides across to restore balance. It does not erase the overload. It absorbs part of it and settles into a new, slightly different shape. Chemical systems respond to a disturbance in the same partial, compensating way.",
      analogy:
        "A disturbance to the equilibrium is like the opponent sending an extra runner down your left. The team shifts toward the overloaded side to relieve the pressure (the reaction shifts to use up what was added) and settles into a new balanced shape that is not identical to the old one.",
      analogy_limits:
        "Defenders anticipate and choose to shift. A reaction has no intent: the shift happens because the disturbance changes one reaction rate more than the other. The analogy also blurs a key distinction. Adding reactant or changing pressure keeps K the same, while changing temperature changes K itself, which is closer to the manager rewriting the game plan than to the team shifting within it.",
      example:
        "Haber process: N₂(g) + 3H₂(g) ⇌ 2NH₃(g), ΔH = −92 kJ/mol. Raising the pressure favours NH₃, because 4 moles of gas become 2. Raising the temperature favours the endothermic reverse reaction, so the equilibrium yield of NH₃ falls. Football version: squeeze the space a team can play in and it compacts into the shape that takes up less room. The response relieves the squeeze but does not cancel it.",
      misconception:
        "\"The system completely undoes the change and returns to the original concentrations.\" It only partly counteracts it. After extra N₂ is added, the new equilibrium still contains more N₂ than before the addition, just less than immediately after it.",
      strength: 4,
    },
    {
      id: "c5",
      name: "Catalysts and equilibrium",
      lecture_explanation:
        "A catalyst lowers the activation energy, which speeds up the forward and the reverse reaction by the same factor. The system therefore reaches equilibrium sooner, but the equilibrium position and the value of K do not change. A catalyst is not used up in the reaction.",
      bridge_title: "Quick ball circulation: same shape, reached sooner",
      bridge_explanation:
        "A slick pitch and one-touch passing let a team get into its attacking shape faster, and recover its defensive shape faster too. Transitions speed up in both directions, but the shape the game plan settles at is unchanged.",
      analogy:
        "A catalyst is like faster ball circulation: every transition, forward or backward, happens more quickly, so the team arrives at its settled shape sooner. It does not change where that settled shape is. The attackers-to-defenders ratio (K) is exactly what it was.",
      analogy_limits:
        "In football, quicker circulation often does change the outcome, because it can tilt a game toward attack. A catalyst can never favour one direction: it speeds both equally and leaves the equilibrium yield untouched. Real catalysts are also specific to particular reactions and can be poisoned, which the analogy does not capture.",
      example:
        "In the Haber process an iron catalyst lets the N₂/H₂/NH₃ mixture reach equilibrium in a practical time. At the same temperature and pressure, the equilibrium percentage of NH₃ is identical with or without the catalyst; it simply arrives far sooner. Football version: with one-touch passing the team is set in its shape in 6 seconds instead of 15, but it is the same shape.",
      misconception:
        "\"A catalyst increases the yield of product.\" It increases the rate, not the equilibrium yield. A plant can make product faster with a catalyst, but the equilibrium composition is the same.",
      strength: 3,
    },
  ],
  concept_map: {
    nodes: [
      { id: "n1", label: "Dynamic equilibrium", type: "lecture" },
      { id: "n2", label: "Equilibrium constant K", type: "lecture" },
      { id: "n3", label: "Reaction quotient Q", type: "lecture" },
      { id: "n4", label: "Le Chatelier's principle", type: "lecture" },
      { id: "n5", label: "Catalyst", type: "lecture" },
      { id: "n6", label: "Shape holds while players swap", type: "interest" },
      { id: "n7", label: "Game plan's attack-defence balance", type: "interest" },
      { id: "n8", label: "Current shape vs. planned shape", type: "interest" },
      { id: "n9", label: "Shifting to absorb an overload", type: "interest" },
      { id: "n10", label: "Faster ball circulation", type: "interest" },
    ],
    edges: [
      { from: "n1", to: "n6", label: "is like" },
      { from: "n2", to: "n7", label: "is like" },
      { from: "n3", to: "n8", label: "is like" },
      { from: "n4", to: "n9", label: "is like" },
      { from: "n5", to: "n10", label: "is like" },
      { from: "n2", to: "n1", label: "quantifies" },
      { from: "n3", to: "n2", label: "is compared with" },
      { from: "n4", to: "n3", label: "predicts shifts in" },
      { from: "n5", to: "n1", label: "speeds the approach to" },
      { from: "n7", to: "n6", label: "sets" },
      { from: "n9", to: "n6", label: "leads to a new" },
    ],
  },
  quiz: [
    {
      question: "Which statement correctly describes a system at dynamic equilibrium?",
      options: [
        "The forward and reverse reactions have both stopped.",
        "The forward and reverse reactions occur at the same rate.",
        "The concentrations of reactants and products are equal.",
        "Only the reverse reaction is still taking place.",
      ],
      answer_index: 1,
      explanation:
        "Both reactions continue, but at equal rates, so the concentrations stay constant. Constant does not mean equal: the mixture can be mostly reactants or mostly products.",
    },
    {
      question:
        "For H₂(g) + I₂(g) ⇌ 2HI(g), the equilibrium concentrations are [H₂] = [I₂] = 0.10 M and [HI] = 0.70 M. What is Kc?",
      options: ["0.020", "7.0", "49", "70"],
      answer_index: 2,
      explanation:
        "Kc = [HI]² / ([H₂][I₂]) = (0.70)² / (0.10 × 0.10) = 0.49 / 0.010 = 49. The coefficient 2 in front of HI becomes the exponent; forgetting to square gives 70, and inverting the expression gives 0.020.",
    },
    {
      question:
        "At a certain temperature K = 49 for a reaction. A mixture is prepared with Q = 16. What happens next?",
      options: [
        "The forward reaction dominates until Q rises to 49.",
        "The reverse reaction dominates and Q falls further.",
        "Nothing, because the system is already at equilibrium.",
        "K decreases until it equals 16.",
      ],
      answer_index: 0,
      explanation:
        "Q < K means there are too few products relative to equilibrium, so there is a net forward reaction until Q = K. K itself does not move unless the temperature changes.",
    },
    {
      question:
        "N₂(g) + 3H₂(g) ⇌ 2NH₃(g) is exothermic in the forward direction. Which change increases the equilibrium yield of NH₃?",
      options: [
        "Raising the temperature",
        "Adding a catalyst",
        "Removing N₂ from the mixture",
        "Increasing the pressure",
      ],
      answer_index: 3,
      explanation:
        "Higher pressure favours the side with fewer gas molecules (4 moles of gas become 2). Raising the temperature favours the endothermic reverse reaction, a catalyst does not change the yield, and removing N₂ shifts the equilibrium back toward the reactants.",
    },
    {
      question: "What is the effect of adding a catalyst to a reversible reaction?",
      options: [
        "It increases K, so more product forms.",
        "It speeds up both directions equally, so equilibrium is reached sooner with the same composition.",
        "It speeds up only the forward reaction.",
        "It shifts the equilibrium toward the side with fewer gas molecules.",
      ],
      answer_index: 1,
      explanation:
        "A catalyst lowers the activation energy for the forward and reverse reactions alike. Equilibrium is reached faster, but K and the equilibrium composition are unchanged.",
    },
  ],
  next_steps: [
    "Watch 15 minutes of a match on a tactical (wide-angle) camera and note, once a minute, how many outfield players each team has ahead of the ball. See how stable the count is in settled play and which events disturb it.",
    "Read about rest defence and counter-pressing, which is how top sides decide how many players stay behind the ball while attacking, and match each idea to dynamic equilibrium, K or Q.",
    "Pick a match that was changed by a red card or a tactical substitution. Describe the old balance, the disturbance and the new shape the team settled into, then say where the comparison with Le Chatelier's principle holds and where it breaks.",
  ],
};

/** The same report translated into Turkish; /report?sample=tr shows it. */
export const SAMPLE_REPORT_TR: Report = {
  title: "Futbol Taktikleri Penceresinden Kimyasal Denge",
  interest: "Futbol taktikleri",
  language: "tr",
  summary:
    "Bu ders, tersinir bir tepkimenin dengede olmasının ne anlama geldiğini, denge sabiti K ile denge kesri Q'nun dengeyi nasıl tanımlayıp öngördüğünü ve dengesi bozulan bir sistemin nasıl tepki verdiğini açıklıyor. Her fikir futbol taktikleriyle ilişkilendiriliyor: oyuncular hareket etmeyi sürdürürken korunan takım dizilişi, bir oyun planının oturduğu denge ve bir takımın yüklenmeyi karşılamak için kayma biçimi. Futbol benzetmesinin kimyayla örtüşmediği her noktada rapor bunu açıkça belirtiyor.",
  concepts: [
    {
      id: "c1",
      name: "Dinamik denge",
      lecture_explanation:
        "Kapalı bir sistemde tersinir bir tepkime, ileri tepkime ile geri tepkime aynı hızla gerçekleştiğinde dengeye ulaşır. İki tepkime de sürer, ancak birbirini dengelediği için girenlerin ve ürünlerin derişimleri artık değişmez. Denge, miktarların eşit olduğu anlamına gelmez; yalnızca sabit olduğu anlamına gelir.",
      bridge_title: "Oyuncular hareket ederken diziliş korunur",
      bridge_explanation:
        "Set hücumu yapan bir takımı izleyin: bekler bindirme yapar, orta saha oyuncuları geriye iner, kanat oyuncuları içeri kat eder. Oyuncular hiç durmaz, yine de genel diziliş, yani topun önünde ve gerisinde kaç oyuncu olduğu, aynı kalır. \"Dinamik\" kelimesinin anlamı budur: tek tek oyuncular düzeyinde sürekli hareket, takımın bütünü düzeyinde ise net değişim yok.",
      analogy:
        "Bir oyuncu orta çizgiyi ileri doğru her geçtiğinde, bir takım arkadaşı çizginin gerisine döner. Oyuncular (moleküller) sürekli yarı saha değiştirir (giren ⇌ ürün), ama iki yöndeki akış eşit olduğu için her yarıdaki oyuncu sayısı (derişimler) sabit kalır.",
      analogy_limits:
        "Oyuncular bir plana uyarak bilerek yer değiştirir. Moleküller ise rastgele çarpışmalarla tepkimeye girer; eşit hızlar bir niyetten değil, yaklaşık 10²³ taneciğin istatistiğinden doğar. Ayrıca bir takımın yalnızca on saha oyuncusu vardır, dolayısıyla \"derişimleri\" ancak birer birer değişir; takım kapalı bir sistem de değildir: ağzı kapalı bir tepkime kabında oyuncu değişikliklerinin ve kırmızı kartların karşılığı yoktur.",
      example:
        "Renksiz N₂O₄'ü bir cam kaba koyup ağzını kapatın: N₂O₄(g) ⇌ 2NO₂(g). NO₂'nin kahverengi rengi koyulaşır, ardından sabit kalır; yine de izotopla işaretleme deneyleri, moleküllerin her iki yönde de dönüşmeyi sürdürdüğünü gösterir. Futboldaki karşılığı: oturmuş oyunun beş dakikasında 12 ileri koşu orta çizgiyi geçer, 12 geri dönüş koşusu da çizgiyi geri geçer. 24 geçiş yaşanmasına rağmen her yarıdaki net değişim sıfırdır.",
      misconception:
        "\"Dengede tepkime durmuştur\" ve \"girenlerin ve ürünlerin miktarları eşittir.\" İkisi de yanlıştır. İki tepkime eşit hızlarla sürer ve karışım büyük ölçüde girenlerden ya da büyük ölçüde ürünlerden oluşabilir.",
      strength: 5,
    },
    {
      id: "c2",
      name: "Denge sabiti, K",
      lecture_explanation:
        "aA + bB ⇌ cC + dD tepkimesi için denge sabiti, dengedeki derişimler kullanılarak Kc = [C]^c [D]^d / ([A]^a [B]^b) şeklinde yazılır. Belirli bir sıcaklıkta K, başlangıç miktarları ne olursa olsun hep aynı değeri alır. Büyük bir K (1'den çok büyük) dengede ürünlerin baskın olduğunu, küçük bir K (1'den çok küçük) ise girenlerin baskın olduğunu gösterir.",
      bridge_title: "Bir oyun planının oturduğu denge",
      bridge_explanation:
        "Her taktik kurgunun kendine özgü bir hücum-savunma dengesi vardır. Yüksek pres yapan bir takım topun önünde çok oyuncuyla yerleşir; derin savunma bloğuyla oynayan bir takım ise az oyuncuyla. Oyun ister başlama vuruşuyla, ister kale vuruşuyla, ister taç atışıyla yeniden başlamış olsun, takım oyun planının belirlediği dengeye geri döner. K, bir tepkime için işte bu yerleşik dengedir.",
      analogy:
        "K, bir takımın sabit bir oyun planıyla oturduğu hücumcu-savunmacı oranına benzer. Topyekûn hücum planı büyük bir K'dır (ürün tarafı kalabalıktır); otobüsü çekme planı ise küçük bir K. Takımın oturduğu oranı yalnızca yeni bir oyun planı (yeni bir sıcaklık) değiştirir.",
      analogy_limits:
        "K, yalnızca sıcaklıkla belirlenen kesin bir sayıdır ve stokiyometrik üsleri içerir. Bir takımın dengesi ise net değildir; skora, yorgunluğa ve rakibe göre değişir. Ayrıca K, dengeye ne kadar hızlı ulaşıldığı hakkında hiçbir şey söylemez; oysa bir oyun planı genellikle bir tempoyu da beraberinde getirir.",
      example:
        "H₂(g) + I₂(g) ⇌ 2HI(g) tepkimesinde denge derişimlerinin [H₂] = [I₂] = 0,10 M ve [HI] = 0,70 M olduğunu varsayalım. Bu durumda Kc = (0,70)² / (0,10 × 0,10) = 49 olur. K, 1'in çok üzerindedir, yani denge ürünler lehinedir: bu, oyuncularının çoğuyla hücum yarısına yerleşen bir takımın kimyadaki karşılığıdır. Bunun yerine saf HI ile başlasanız da aynı sıcaklıkta karışım yine K = 49'u sağlayacak şekilde dengelenir; tıpkı takımın oyun nasıl yeniden başlarsa başlasın aynı dengeyi bulması gibi.",
      misconception:
        "\"Daha fazla giren eklerseniz ya da basıncı değiştirirseniz K değişir.\" Değişmez. Bu değişiklikler derişimleri değiştirir; sistem de aynı K yeniden sağlanana kadar kendini yeniden ayarlar. Yeni bir K'yı yalnızca sıcaklık değişimi verir.",
      strength: 4,
    },
    {
      id: "c3",
      name: "Denge kesri, Q",
      lecture_explanation:
        "Denge kesri Q, K ile aynı ifadeyi kullanır; ancak dengedeki derişimler yerine herhangi bir andaki derişimlerle hesaplanır. İkisini karşılaştırmak, tepkimenin hangi yöne ilerleyeceğini söyler. Q < K ise ürünler gereğinden azdır, bu yüzden ileri tepkime baskın olur. Q > K ise ürünler gereğinden fazladır, bu yüzden geri tepkime baskın olur. Q = K ise sistem dengededir.",
      bridge_title: "Anlık dizilişi planla karşılaştırmak",
      bridge_explanation:
        "Teknik direktör sahaya bir göz atar ve o anki dizilişi planın gerektirdiği dizilişle karşılaştırır. İleride çok az oyuncu mu var? Öne çıkın. Çok fazla oyuncu ileride mi kaldı? Geri dönün. Q anlık görüntüdür, K hedeftir; aradaki fark da bir sonraki hareketin hangi yöne olacağını söyler.",
      analogy:
        "Q, o andaki hücumcu-savunmacı oranıdır; K ise oyun planının oturduğu oran. Q < K: takım fazla geride, bu yüzden oyuncular öne çıkar (ileri tepkime). Q > K: takım hücuma fazla oyuncu yığmış, bu yüzden oyuncular geri koşar (geri tepkime). Q = K: diziliş doğrudur ve yalnızca birebir yer değiştirmeler sürer.",
      analogy_limits:
        "Bir takım bu uyumsuzluğu görmezden gelebilir, çünkü yorgun oyuncular geri koşmayabilir; ama kimyasal bir karışım her zaman K'ya doğru ilerler. Moleküller ayrıca bir hedefi \"görmez\": net kayma yalnızca bir yöndeki tepkime hızı geçici olarak diğerininkinden yüksek olduğu için ortaya çıkar.",
      example:
        "H₂(g) + I₂(g) ⇌ 2HI(g) için K = 49 iken bir karışımda [H₂] = [I₂] = 0,20 M ve [HI] = 0,80 M bulunuyor. Q = (0,80)² / (0,20 × 0,20) = 16. 16 < 49 olduğundan ileri tepkime baskın gelir ve Q 49'a yükselene kadar daha fazla HI oluşur. Sahada: plan yüksek bir hücumcu-savunmacı oranında oturuyor, mevcut oran daha düşük; bu yüzden takım, dizilişi planla örtüşene kadar öne çıkar.",
      misconception:
        "\"Q ve K aynı şeydir.\" Formülleri aynıdır, ama K belirli bir sıcaklıkta tek ve sabit bir değerdir; Q ise o anki karışıma bağlı olarak herhangi bir değer alabilir. İkisi yalnızca dengede eşittir.",
      strength: 4,
    },
    {
      id: "c4",
      name: "Le Chatelier ilkesi",
      lecture_explanation:
        "Dengedeki bir sistemin dengesi bozulursa sistem, bu bozulmayı kısmen azaltacak yöne kayar. Giren eklemek dengeyi ürünlere doğru kaydırır. Basıncı artırmak dengeyi daha az gaz molekülü olan tarafa kaydırır. Sıcaklığı yükseltmek dengeyi endotermik yöne kaydırır. Derişim ve basınç değişiklikleri K'yı değiştirmez, ama sıcaklık değişimi K'ya yeni bir değer verir.",
      bridge_title: "Yüklenmeyi karşılamak için yana kaymak",
      bridge_explanation:
        "Rakip bir kanatta yüklenme yaptığında, iyi çalışılmış bir takım dengeyi yeniden kurmak için o tarafa kayar. Yüklenmeyi tamamen ortadan kaldırmaz. Bir kısmını karşılar ve yeni, biraz farklı bir dizilişe oturur. Kimyasal sistemler de bir bozulmaya aynı kısmi, telafi edici biçimde tepki verir.",
      analogy:
        "Dengeyi bozan bir etki, rakibin sol kanadınıza fazladan bir oyuncu koşturmasına benzer. Takım baskıyı hafifletmek için yüklenilen tarafa kayar (tepkime de eklenen maddeyi tüketecek yöne kayar) ve eskisinin aynısı olmayan yeni, dengeli bir dizilişe oturur.",
      analogy_limits:
        "Savunmacılar oyunu önceden okur ve kaymaya kendileri karar verir. Bir tepkimenin ise niyeti yoktur: kayma, bozulma tepkime hızlarından birini diğerinden daha çok değiştirdiği için olur. Benzetme önemli bir ayrımı da bulanıklaştırır. Giren eklemek ya da basıncı değiştirmek K'yı aynı bırakır; sıcaklığı değiştirmek ise K'nın kendisini değiştirir. Bu da takımın plan içinde kaymasından çok teknik direktörün oyun planını yeniden yazmasına benzer.",
      example:
        "Haber yöntemi: N₂(g) + 3H₂(g) ⇌ 2NH₃(g), ΔH = −92 kJ/mol. Basıncı artırmak NH₃ oluşumunu destekler, çünkü 4 mol gaz 2 mol gaza dönüşür. Sıcaklığı yükseltmek endotermik geri tepkimeyi destekler, bu yüzden NH₃'ün denge verimi düşer. Futboldaki karşılığı: bir takımın oynayabileceği alanı daraltın, takım daha az yer kaplayan bir dizilişe sıkışır. Bu tepki daralmanın etkisini hafifletir ama ortadan kaldırmaz.",
      misconception:
        "\"Sistem değişikliği tamamen geri alır ve ilk derişimlere döner.\" Sistem değişikliğin etkisini yalnızca kısmen giderir. Fazladan N₂ eklendikten sonra yeni denge, eklemeden öncekinden yine daha fazla N₂ içerir; yalnızca eklemenin hemen sonrasındakinden daha az.",
      strength: 4,
    },
    {
      id: "c5",
      name: "Katalizörler ve denge",
      lecture_explanation:
        "Katalizör aktifleşme enerjisini düşürür; bu da ileri ve geri tepkimeyi aynı oranda hızlandırır. Bu nedenle sistem dengeye daha çabuk ulaşır, ancak denge konumu ve K'nın değeri değişmez. Katalizör tepkimede harcanmaz.",
      bridge_title: "Hızlı top dolaşımı: aynı diziliş, daha çabuk",
      bridge_explanation:
        "Hızlı bir zemin ve tek pas oyunu, bir takımın hücum dizilişine daha hızlı geçmesini ve savunma dizilişini de daha hızlı yeniden kurmasını sağlar. Geçişler her iki yönde de hızlanır, ama oyun planının oturduğu diziliş değişmez.",
      analogy:
        "Katalizör daha hızlı top dolaşımına benzer: ileriye ya da geriye her geçiş daha çabuk gerçekleşir, bu yüzden takım oturduğu dizilişe daha erken ulaşır. Bu, o dizilişin nerede olduğunu değiştirmez. Hücumcu-savunmacı oranı (K) tam olarak eskisi gibidir.",
      analogy_limits:
        "Futbolda daha hızlı top dolaşımı çoğu zaman sonucu gerçekten değiştirir, çünkü oyunu hücum lehine çevirebilir. Bir katalizör ise hiçbir zaman tek bir yönü kayırmaz: iki yönü eşit hızlandırır ve denge verimine dokunmaz. Ayrıca gerçek katalizörler belirli tepkimelere özgüdür ve zehirlenebilir; benzetme bunu yansıtmaz.",
      example:
        "Haber yönteminde demir katalizör, N₂/H₂/NH₃ karışımının makul bir sürede dengeye ulaşmasını sağlar. Aynı sıcaklık ve basınçta NH₃'ün denge yüzdesi katalizörle de katalizörsüz de aynıdır; denge yalnızca çok daha erken kurulur. Futboldaki karşılığı: tek pas oyunuyla takım dizilişini 15 yerine 6 saniyede alır, ama diziliş aynıdır.",
      misconception:
        "\"Katalizör ürün verimini artırır.\" Katalizör denge verimini değil, hızı artırır. Bir tesis katalizörle daha hızlı ürün üretebilir, ama denge bileşimi aynıdır.",
      strength: 3,
    },
  ],
  concept_map: {
    nodes: [
      { id: "n1", label: "Dinamik denge", type: "lecture" },
      { id: "n2", label: "Denge sabiti K", type: "lecture" },
      { id: "n3", label: "Denge kesri Q", type: "lecture" },
      { id: "n4", label: "Le Chatelier ilkesi", type: "lecture" },
      { id: "n5", label: "Katalizör", type: "lecture" },
      { id: "n6", label: "Oyuncular yer değiştirirken diziliş korunur", type: "interest" },
      { id: "n7", label: "Oyun planının hücum-savunma dengesi", type: "interest" },
      { id: "n8", label: "Anlık diziliş, plana karşı", type: "interest" },
      { id: "n9", label: "Yüklenmeyi karşılamak için kayma", type: "interest" },
      { id: "n10", label: "Daha hızlı top dolaşımı", type: "interest" },
    ],
    edges: [
      { from: "n1", to: "n6", label: "benzer" },
      { from: "n2", to: "n7", label: "benzer" },
      { from: "n3", to: "n8", label: "benzer" },
      { from: "n4", to: "n9", label: "benzer" },
      { from: "n5", to: "n10", label: "benzer" },
      { from: "n2", to: "n1", label: "sayısal olarak ifade eder" },
      { from: "n3", to: "n2", label: "ile karşılaştırılır" },
      { from: "n4", to: "n3", label: "kaymalarını öngörür" },
      { from: "n5", to: "n1", label: "ulaşmayı hızlandırır" },
      { from: "n7", to: "n6", label: "belirler" },
      { from: "n9", to: "n6", label: "yenisini oluşturur" },
    ],
  },
  quiz: [
    {
      question: "Dinamik dengedeki bir sistemi hangi ifade doğru tanımlar?",
      options: [
        "İleri ve geri tepkimelerin ikisi de durmuştur.",
        "İleri ve geri tepkimeler aynı hızla gerçekleşir.",
        "Girenlerin ve ürünlerin derişimleri eşittir.",
        "Yalnızca geri tepkime sürmektedir.",
      ],
      answer_index: 1,
      explanation:
        "İki tepkime de sürer, ancak eşit hızlarla; bu yüzden derişimler sabit kalır. Sabit, eşit demek değildir: karışım büyük ölçüde girenlerden ya da büyük ölçüde ürünlerden oluşabilir.",
    },
    {
      question:
        "H₂(g) + I₂(g) ⇌ 2HI(g) tepkimesinde denge derişimleri [H₂] = [I₂] = 0,10 M ve [HI] = 0,70 M'dır. Kc kaçtır?",
      options: ["0,020", "7,0", "49", "70"],
      answer_index: 2,
      explanation:
        "Kc = [HI]² / ([H₂][I₂]) = (0,70)² / (0,10 × 0,10) = 0,49 / 0,010 = 49. HI'nın önündeki 2 katsayısı üs olur; karesini almayı unutmak 70 sonucunu, ifadeyi ters çevirmek ise 0,020 sonucunu verir.",
    },
    {
      question:
        "Belirli bir sıcaklıkta bir tepkime için K = 49'dur. Q = 16 olan bir karışım hazırlanıyor. Bundan sonra ne olur?",
      options: [
        "Q 49'a yükselene kadar ileri tepkime baskın olur.",
        "Geri tepkime baskın olur ve Q daha da düşer.",
        "Hiçbir şey olmaz, çünkü sistem zaten dengededir.",
        "K, 16'ya eşit olana kadar azalır.",
      ],
      answer_index: 0,
      explanation:
        "Q < K, dengeye göre ürünlerin gereğinden az olduğu anlamına gelir; bu yüzden Q = K olana kadar net bir ileri tepkime gerçekleşir. Sıcaklık değişmedikçe K'nın kendisi değişmez.",
    },
    {
      question:
        "N₂(g) + 3H₂(g) ⇌ 2NH₃(g) tepkimesi ileri yönde ekzotermiktir. Hangi değişiklik NH₃'ün denge verimini artırır?",
      options: [
        "Sıcaklığı yükseltmek",
        "Katalizör eklemek",
        "Karışımdan N₂ uzaklaştırmak",
        "Basıncı artırmak",
      ],
      answer_index: 3,
      explanation:
        "Yüksek basınç, daha az gaz molekülü olan tarafı destekler (4 mol gaz 2 mol gaza dönüşür). Sıcaklığı yükseltmek endotermik geri tepkimeyi destekler, katalizör verimi değiştirmez, N₂ uzaklaştırmak ise dengeyi geriye, girenlere doğru kaydırır.",
    },
    {
      question: "Tersinir bir tepkimeye katalizör eklemenin etkisi nedir?",
      options: [
        "K'yı artırır, bu yüzden daha fazla ürün oluşur.",
        "İki yönü de eşit hızlandırır, bu yüzden dengeye aynı bileşimle daha çabuk ulaşılır.",
        "Yalnızca ileri tepkimeyi hızlandırır.",
        "Dengeyi daha az gaz molekülü olan tarafa kaydırır.",
      ],
      answer_index: 1,
      explanation:
        "Katalizör, ileri ve geri tepkimelerin aktifleşme enerjisini aynı ölçüde düşürür. Dengeye daha hızlı ulaşılır, ama K ve denge bileşimi değişmez.",
    },
  ],
  next_steps: [
    "Bir maçın 15 dakikasını taktik (geniş açı) kamerasından izleyin ve dakikada bir, her takımın topun önünde kaç saha oyuncusu olduğunu not edin. Oturmuş oyunda bu sayının ne kadar sabit kaldığına ve hangi olayların onu bozduğuna bakın.",
    "Üst düzey takımların hücum ederken topun gerisinde kaç oyuncu bırakacağına karar verme biçimi olan rest defence (geride kalan savunma yapısı) ve karşı pres hakkında okuyun; her fikri dinamik denge, K ya da Q ile eşleştirin.",
    "Bir kırmızı kartın ya da taktik bir oyuncu değişikliğinin seyrini değiştirdiği bir maç seçin. Eski dengeyi, bozucu etkiyi ve takımın oturduğu yeni dizilişi anlatın; ardından Le Chatelier ilkesiyle yapılan karşılaştırmanın nerede tutup nerede tutmadığını belirtin.",
  ],
};
